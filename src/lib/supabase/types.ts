export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  file_name: string;
  storage_path: string;
  public_url: string;
  caption: string | null;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
}

export interface PhotoFeed {
  photos: Photo[];
  page: number;
  limit: number;
  total_count: number;
  has_more: boolean;
}