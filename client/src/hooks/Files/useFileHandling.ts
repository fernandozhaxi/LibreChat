import { v4 } from 'uuid';
import debounce from 'lodash/debounce';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  megabyte,
  QueryKeys,
  EModelEndpoint,
  codeTypeMapping,
  mergeFileConfig,
  isAssistantsEndpoint,
  defaultAssistantsVersion,
  fileConfig as defaultFileConfig,
} from 'librechat-data-provider';
import type { TEndpointsConfig, TError } from 'librechat-data-provider';
import type { ExtendedFile, FileSetter } from '~/common';
import { useUploadFileMutation, useGetFileConfig } from '~/data-provider';
import { useDelayedUploadToast } from './useDelayedUploadToast';
import { useToastContext } from '~/Providers/ToastContext';
import { useChatContext } from '~/Providers/ChatContext';
import useLocalize from '~/hooks/useLocalize';
import useUpdateFiles from './useUpdateFiles';
import piexif from 'piexifjs';
import { logger } from '~/utils';

const { checkType } = defaultFileConfig;

type UseFileHandling = {
  overrideEndpoint?: EModelEndpoint;
  fileSetter?: FileSetter;
  fileFilter?: (file: File) => boolean;
  additionalMetadata?: Record<string, string | undefined>;
};

const useFileHandling = (params?: UseFileHandling) => {
  const localize = useLocalize();
  const queryClient = useQueryClient();
  const { showToast } = useToastContext();
  const [errors, setErrors] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { startUploadTimer, clearUploadTimer } = useDelayedUploadToast();
  const { files, setFiles, setFilesLoading, conversation } = useChatContext();
  const setError = (error: string) => setErrors((prevErrors) => [...prevErrors, error]);
  const { addFile, replaceFile, updateFileById, deleteFileById } = useUpdateFiles(
    params?.fileSetter ?? setFiles,
  );

  const agent_id = params?.additionalMetadata?.agent_id ?? '';
  const assistant_id = params?.additionalMetadata?.assistant_id ?? '';

  const { data: fileConfig = defaultFileConfig } = useGetFileConfig({
    select: (data) => mergeFileConfig(data),
  });
  const endpoint =
    params?.overrideEndpoint ?? conversation?.endpointType ?? conversation?.endpoint ?? 'default';

  const { fileLimit, fileSizeLimit, totalSizeLimit, supportedMimeTypes } =
    fileConfig.endpoints[endpoint] ?? fileConfig.endpoints.default;

  const displayToast = useCallback(() => {
    if (errors.length > 1) {
      const errorList = Array.from(new Set(errors))
        .map((e, i) => `${i > 0 ? '• ' : ''}${localize(e) || e}\n`)
        .join('');
      showToast({
        message: errorList,
        status: 'error',
        duration: 5000,
      });
    } else if (errors.length === 1) {
      const message = localize(errors[0]) || errors[0];
      showToast({
        message,
        status: 'error',
        duration: 5000,
      });
    }

    setErrors([]);
  }, [errors, showToast, localize]);

  const debouncedDisplayToast = debounce(displayToast, 250);

  useEffect(() => {
    if (errors.length > 0) {
      debouncedDisplayToast();
    }

    return () => debouncedDisplayToast.cancel();
  }, [errors, debouncedDisplayToast]);

  const uploadFile = useUploadFileMutation(
    {
      onSuccess: (data) => {
        clearUploadTimer(data.temp_file_id);
        console.log('upload success', data);
        if (agent_id) {
          queryClient.refetchQueries([QueryKeys.agent, agent_id]);
          return;
        }
        updateFileById(
          data.temp_file_id,
          {
            progress: 0.9,
            filepath: data.filepath,
          },
          assistant_id ? true : false,
        );

        setTimeout(() => {
          updateFileById(
            data.temp_file_id,
            {
              progress: 1,
              file_id: data.file_id,
              temp_file_id: data.temp_file_id,
              filepath: data.filepath,
              type: data.type,
              height: data.height,
              width: data.width,
              filename: data.filename,
              source: data.source,
              embedded: data.embedded,
            },
            assistant_id ? true : false,
          );
        }, 300);
      },
      onError: (_error, body) => {
        const error = _error as TError | undefined;
        console.log('upload error', error);
        const file_id = body.get('file_id');
        clearUploadTimer(file_id as string);
        deleteFileById(file_id as string);
        const errorMessage =
          error?.code === 'ERR_CANCELED'
            ? 'com_error_files_upload_canceled'
            : error?.response?.data?.message ?? 'com_error_files_upload';
        setError(errorMessage);
      },
    },
    abortControllerRef.current?.signal,
  );

  const startUpload = async (extendedFile: ExtendedFile) => {
    const filename = extendedFile.file?.name ?? 'File';
    startUploadTimer(extendedFile.file_id, filename, extendedFile.size);

    const formData = new FormData();
    formData.append('file', extendedFile.file as File, encodeURIComponent(filename));
    formData.append('file_id', extendedFile.file_id);

    const width = extendedFile.width ?? 0;
    const height = extendedFile.height ?? 0;
    if (width) {
      formData.append('width', width.toString());
    }
    if (height) {
      formData.append('height', height.toString());
    }

    const metadata = params?.additionalMetadata ?? {};
    if (params?.additionalMetadata) {
      for (const [key, value = ''] of Object.entries(metadata)) {
        if (value) {
          formData.append(key, value);
        }
      }
    }

    formData.append('endpoint', endpoint);

    if (!isAssistantsEndpoint(endpoint)) {
      debugger;
      uploadFile.mutate(formData);
      return;
    }

    const convoModel = conversation?.model ?? '';
    const convoAssistantId = conversation?.assistant_id ?? '';

    if (!assistant_id) {
      formData.append('message_file', 'true');
    }

    const endpointsConfig = queryClient.getQueryData<TEndpointsConfig>([QueryKeys.endpoints]);
    const version = endpointsConfig?.[endpoint]?.version ?? defaultAssistantsVersion[endpoint];

    if (!assistant_id && convoAssistantId) {
      formData.append('version', version);
      formData.append('model', convoModel);
      formData.append('assistant_id', convoAssistantId);
    }

    const formVersion = (formData.get('version') ?? '') as string;
    if (!formVersion) {
      formData.append('version', version);
    }

    const formModel = (formData.get('model') ?? '') as string;
    if (!formModel) {
      formData.append('model', convoModel);
    }

    uploadFile.mutate(formData);
  };

  const validateFiles = (fileList: File[]) => {
    const existingFiles = Array.from(files.values());
    const incomingTotalSize = fileList.reduce((total, file) => total + file.size, 0);
    if (incomingTotalSize === 0) {
      setError('com_error_files_empty');
      return false;
    }
    const currentTotalSize = existingFiles.reduce((total, file) => total + file.size, 0);

    if (fileList.length + files.size > fileLimit) {
      setError(`You can only upload up to ${fileLimit} files at a time.`);
      return false;
    }

    for (let i = 0; i < fileList.length; i++) {
      let originalFile = fileList[i];
      let fileType = originalFile.type;
      const extension = originalFile.name.split('.').pop() ?? '';
      const knownCodeType = codeTypeMapping[extension];

      // Infer MIME type for Known Code files when the type is empty or a mismatch
      if (knownCodeType && (!fileType || fileType !== knownCodeType)) {
        fileType = knownCodeType;
      }

      // Check if the file type is still empty after the extension check
      if (!fileType) {
        setError('Unable to determine file type for: ' + originalFile.name);
        return false;
      }

      // Replace empty type with inferred type
      if (originalFile.type !== fileType) {
        const newFile = new File([originalFile], originalFile.name, { type: fileType });
        originalFile = newFile;
        fileList[i] = newFile;
      }

      if (!checkType(originalFile.type, supportedMimeTypes)) {
        console.log(originalFile);
        setError('Currently, unsupported file type: ' + originalFile.type);
        return false;
      }

      if (originalFile.size >= fileSizeLimit) {
        setError(`File size exceeds ${fileSizeLimit / megabyte} MB.`);
        return false;
      }
    }

    if (currentTotalSize + incomingTotalSize > totalSizeLimit) {
      setError(`The total size of the files cannot exceed ${totalSizeLimit / megabyte} MB.`);
      return false;
    }

    const combinedFilesInfo = [
      ...existingFiles.map(
        (file) =>
          `${file.file?.name ?? file.filename}-${file.size}-${file.type?.split('/')[0] ?? 'file'}`,
      ),
      ...fileList.map(
        (file: File | undefined) =>
          `${file?.name}-${file?.size}-${file?.type.split('/')[0] ?? 'file'}`,
      ),
    ];

    const uniqueFilesSet = new Set(combinedFilesInfo);

    if (uniqueFilesSet.size !== combinedFilesInfo.length) {
      setError('com_error_files_dupe');
      return false;
    }

    return true;
  };

  function dataURLToFile(dataURL, filename, type) {
    const arr = dataURL.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    // 创建 Blob 对象
    const blob = new Blob([u8arr], type);
    // 创建 File 对象
    return new File([blob], filename, type);
  }

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      let exifStr = '';

      reader.onload = (event) => {
        const src = event.target?.result as string;
        img.src = src;
        const exifObj = piexif.load(src);
        exifStr = piexif.dump(exifObj);
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let quality = 1; // 初始质量
        let byteSize = file.size;

        const MAX_SIZE = 2 * 1024 * 1024; // 2MB

        const adjustCompression = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) {
              byteSize = blob.size; // 更新当前大小
              if (byteSize > MAX_SIZE) {
                // 缩小质量
                quality -= 0.01; // 降低质量
                if (quality > 0) {
                  return adjustCompression(); // 继续调整
                }
              }
              const dataUrl = canvas.toDataURL(file.type, quality);
              const inserted = piexif.insert(exifStr, dataUrl);
              const compressionFile = dataURLToFile(inserted, file.name, { type: file.type });
              resolve(compressionFile);
            } else {
              reject(new Error('Compression failed.'));
            }
          }, file.type, quality);
        };

        adjustCompression(); // 开始压缩
      };

      reader.readAsDataURL(file);
    });
  };

  const loadImage = async (extendedFile: ExtendedFile, preview: string) => {
    // 检查文件大小是否超过2MB
    if (extendedFile.size > 2 * 1024 * 1024) {
      const file = await compressImage(extendedFile.file);
      extendedFile.file = file;
      extendedFile.size = file.size;
    }

    const img = new Image();
    img.onload = async () => {
      extendedFile.width = img.width;
      extendedFile.height = img.height;
      extendedFile = {
        ...extendedFile,
        progress: 0.6,
      };
      replaceFile(extendedFile);

      await startUpload(extendedFile);
      URL.revokeObjectURL(preview);
    };
    img.src = preview;
  };

  const handleFiles = async (_files: FileList | File[]) => {
    abortControllerRef.current = new AbortController();
    const fileList = Array.from(_files);
    /* Validate files */
    let filesAreValid: boolean;
    try {
      filesAreValid = validateFiles(fileList);
    } catch (error) {
      console.error('file validation error', error);
      setError('com_error_files_validation');
      return;
    }
    if (!filesAreValid) {
      setFilesLoading(false);
      return;
    }

    /* Process files */
    for (const originalFile of fileList) {
      const file_id = v4();
      try {
        const preview = URL.createObjectURL(originalFile);
        const extendedFile: ExtendedFile = {
          file_id,
          file: originalFile,
          type: originalFile.type,
          preview,
          progress: 0.2,
          size: originalFile.size,
        };

        addFile(extendedFile);

        if (originalFile.type.split('/')[0] === 'image') {
          loadImage(extendedFile, preview);
          continue;
        }

        await startUpload(extendedFile);
      } catch (error) {
        deleteFileById(file_id);
        console.log('file handling error', error);
        setError('com_error_files_process');
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.target.files) {
      setFilesLoading(true);
      handleFiles(event.target.files);
      // reset the input
      event.target.value = '';
    }
  };

  const abortUpload = () => {
    if (abortControllerRef.current) {
      logger.log('files', 'Aborting upload');
      abortControllerRef.current.abort('User aborted upload');
      abortControllerRef.current = null;
    }
  };

  return {
    handleFileChange,
    handleFiles,
    abortUpload,
    setFiles,
    files,
  };
};

export default useFileHandling;
