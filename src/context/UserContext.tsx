import { createContext, useContext } from "react"

export type UserContent = {
    page: string
    setPage: (page: string) => void
    user: any
    setUser: (user: any) => void
    session: any
    setSession: (user: any) => void
}

// default value
export const UserContext = createContext<UserContent>({
    page: null,
    setPage: () => { },
    user: null,
    setUser: () => { },
    session: null,
    setSession: () => { },
});

export const useUserContext = () => useContext(UserContext)