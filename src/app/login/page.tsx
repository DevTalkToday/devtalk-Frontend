'use client'

import { useState } from "react";
import { startGithubLogin } from "@/lib/auth/github";
import { Input, Button } from "@/components/ui"

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");


    return (
    <div className="mx-auto max-w-md p-6">
      <Input
        label="아이디"
        content="id"
        value={username}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Input
        label="비밀번호"
        content="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        content="로그인"
      />

      <Button
        className="mt-6 w-full rounded-lg border px-4 py-3 text-left hover:bg-gray-50"
        onClick={() => startGithubLogin()}
        content="Continue with GitHub"
      />
    </div>
    )
}