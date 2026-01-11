import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const jsonify = <T>(response: Response | Promise<Response>) => {
  return response instanceof Response
    ? (response.json() as Promise<T>)
    : response.then((r) => r.json() as Promise<T>)
}
