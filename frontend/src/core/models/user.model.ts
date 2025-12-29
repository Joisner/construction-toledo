export interface IUser {
    id: string,
    username: string,
    email: string,
    hashed_password: string,
    is_active: boolean,
    is_admin: boolean
}