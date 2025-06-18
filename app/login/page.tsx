import { redirect } from "next/navigation"

export default function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const callbackUrl = searchParams.callbackUrl
    ? `?callbackUrl=${searchParams.callbackUrl}`
    : ""
  
  redirect(`/auth/login${callbackUrl}`)
} 