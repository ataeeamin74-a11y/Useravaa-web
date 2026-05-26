export type UploadIntent = {
  userId: string;
  contentType: string;
  byteLength: number;
};

export type UploadResult = {
  status: "adapter_not_configured";
};

export interface UploadAdapter {
  prepareAvatarUpload(input: UploadIntent): Promise<UploadResult>;
}

export const uploadAdapter: UploadAdapter = {
  async prepareAvatarUpload() {
    return { status: "adapter_not_configured" };
  }
};
