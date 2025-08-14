export interface UserInDB {
    id: string;
    name: string;
    email: string;
    created_at: string;
}

export interface UserCreate {
    name: string;
    email: string;
    password: string;
}

export interface UserUpdate {
    name: string;
    email: string;
    password?: string;
}

export interface Token {
    access_token: string;
    token_type: string;
}

export interface GroupInDB {
    id: string;
    name: string;
}

export interface GroupCreate {
    name: string;
}

export interface GroupUpdate {
    name: string;
}

export interface GroupMemberInDB {
    id: number;
    user_id?: string | null;
    name?: string | null;
    is_admin: boolean;
}

export interface GroupMemberCreate {
    user_id?: string | null;
    name?: string | null;
    is_admin?: boolean;
}

export interface ExpenseShareInput {
    member_id: number;
    share?: number | null;
    is_paid: boolean;
}

export interface ExpenseShareInDB {
    member_id: number;
    share?: number | null;
    is_paid: boolean;
}

export interface ExpenseCreate {
    amount: number;
    description?: string | null;
    created_at: string;
    category_id?: number | null;
    group_id: string;
    shares: ExpenseShareInput[];
}

export interface ExpenseUpdate {
    amount: number;
    description?: string | null;
    created_at: string;
    category_id?: number | null;
    shares: ExpenseShareInput[];
}

export interface ExpenseShareUpdate {
    member_id: number;
    share?: number | null;
    is_paid: boolean;
}

export interface ExpenseInDB {
    id: string;
    amount: number;
    description?: string | null;
    created_at: string;
    category_id?: number | null;
    group_id: string;
    shares: ExpenseShareInDB[];
    is_settled: boolean;
}

export interface CategoryInDB {
    id: number;
    name: string;
    icon: string;
    color: string;
    is_default: boolean;
}

export interface CategoryCreate {
    name: string;
    icon?: string;
    color?: string;
    group_id: string;
}

export interface SubscriptionInDB {
    id: number;
    plan: string;
    start_date: string;
    end_date: string;
    group_id: string;
}

export interface SubscriptionCreate {
    plan: string;
    end_date: string;
    group_id: string;
}

export interface ApiError {
    detail: string;
}