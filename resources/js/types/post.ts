export type PostAuthor = {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
};

export type Post = {
    id: number;
    caption: string | null;
    image_url: string;
    created_at: string; // ISO 8601
    likes_count: number;
    comments_count: number;
    liked_by_user: boolean;
    user: PostAuthor;
    can: { update: boolean; delete: boolean };
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
};
