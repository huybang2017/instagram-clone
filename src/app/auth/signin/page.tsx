"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Github, Mail } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignIn = async (provider: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let result;

      if (provider === "credentials") {
        result = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password,
          callbackUrl,
        });
      } else {
        result = await signIn(provider, {
          callbackUrl,
        });
        return;
      }

      if (result?.error) {
        setError("Sai email hoặc mật khẩu");
      } else if (result?.url) {
        router.push(callbackUrl);
      }
    } catch (error) {
      setError("Đã xảy ra lỗi, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/instagram-logo.png"
            alt="Instagram"
            width={180}
            height={60}
            className="mb-6 invert"
          />
          <h1 className="text-2xl font-bold text-white">Đăng nhập</h1>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 shadow-md">
          <Tabs defaultValue="credentials">
            <TabsList className="grid w-full grid-cols-2 bg-neutral-800">
              <TabsTrigger
                value="credentials"
                className="data-[state=active]:bg-neutral-700"
              >
                Email & Mật khẩu
              </TabsTrigger>
              <TabsTrigger
                value="providers"
                className="data-[state=active]:bg-neutral-700"
              >
                Đăng nhập với
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-400"
                />
              </div>

              <div className="space-y-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mật khẩu"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-400"
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-800 bg-red-900/50 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <Button
                className="w-full bg-purple-600 text-white hover:bg-purple-700"
                onClick={() => handleSignIn("credentials")}
                disabled={isLoading || !formData.email || !formData.password}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>

              <div className="text-center text-sm">
                <Link
                  href="/auth/forgot-password"
                  className="text-purple-400 hover:text-purple-300 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="providers" className="py-4">
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="flex w-full items-center gap-2 border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"
                  onClick={() => handleSignIn("github")}
                  disabled={isLoading}
                >
                  <Github className="h-5 w-5" />
                  <span>Đăng nhập với GitHub</span>
                </Button>

                <Button
                  variant="outline"
                  className="flex w-full items-center gap-2 border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"
                  onClick={() => handleSignIn("google")}
                  disabled={isLoading}
                >
                  <Mail className="h-5 w-5" />
                  <span>Đăng nhập với Google</span>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-400">
            Chưa có tài khoản?{" "}
            <Link
              href="/auth/register"
              className="text-purple-400 hover:text-purple-300 hover:underline"
            >
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
