export class CreateNoticeDto {
  title!: string;
  content!: string;
  audienceType!: 'all' | 'role' | 'class' | 'individual';
  targetAudience?: string[]; // role names like ['Teacher', 'Student'] or class IDs
  attachments?: Array<{ name: string; url: string; size?: number }>;
  publishAt?: string;
  expiresAt?: string;
  readReceiptsEnabled?: boolean;
}

export class QueryNoticeDto {
  audienceType?: string;
  page?: number;
  pageSize?: number;
}
