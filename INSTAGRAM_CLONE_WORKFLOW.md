# Instagram Clone Workflow Instructor

## Tổng quan về Dự án

Đây là một dự án Instagram Clone được xây dựng với T3 Stack, bao gồm Next.js (App Router), Prisma, tRPC, NextAuth.js, và Tailwind CSS.

## Kiến trúc và Công nghệ

### Stack Công nghệ

- **Next.js (App Router)**: Framework React cho phép SSR và CSR
- **Prisma**: ORM để tương tác với cơ sở dữ liệu MySQL
- **tRPC**: Type-safe API giữa client và server
- **NextAuth.js**: Xác thực người dùng
- **Tailwind CSS**: Utility-first CSS framework
- **Cloudinary**: Dịch vụ quản lý và lưu trữ hình ảnh

### Cấu trúc Dự án

- **/prisma**: Schema cơ sở dữ liệu và migrations
- **/src/app**: Next.js App Router components và pages
- **/src/server**: Logic phía server (API, xác thực, DB)
- **/src/trpc**: Cấu hình tRPC client/server
- **/src/components**: UI components tái sử dụng
- **/src/styles**: CSS toàn cục
- **/src/lib/cloudinary.ts**: Cấu hình và helper functions cho Cloudinary

## Server và Client Components

### Server Components

- Được định nghĩa là các `async function`
- Chạy trên server, không bao gồm các tính năng tương tác
- Truy cập trực tiếp dữ liệu và API từ server
- Ví dụ: `src/app/page.tsx`

### Client Components

- Được đánh dấu với `"use client"`
- Chạy trên trình duyệt, hỗ trợ tính năng tương tác
- Sử dụng React hooks và event handlers
- Ví dụ: `src/app/_components/post.tsx`

## Data Flow và API

### Server API (tRPC)

- **Định nghĩa Router**: `/src/server/api/routers/`
- **Root Router**: `/src/server/api/root.ts`
- **Context API**: `/src/server/api/trpc.ts`

### Client API

- **React Hooks**: `import { api } from "~/trpc/react"`
- **Server-side API**: `import { api } from "~/trpc/server"`

### Hydration Process

- Server components fetch data
- `<HydrateClient>` wrapper hydrates data on client
- Client components can then use React hooks

### Cloudinary Integration

- **Configuration**: `/src/lib/cloudinary.ts`
- **Upload Functions**: Direct browser upload to Cloudinary
- **Image Upload Component**: `/src/app/_components/image-uploader.tsx`

## Authentication

- **Configuration**: `/src/server/auth/config.ts`
- **Session Check**: `const session = await auth()`
- **Protected Routes**: Redirect if no session
- **Protected API**: Use `protectedProcedure`

## Database

- **Schema**: `/prisma/schema.prisma`
- **Connection**: `/src/server/db.ts`
- **Models**: User, Post, Account, Session, etc.
- **Migrations**: `npx prisma migrate dev`

## Workflow Guide

### 1. Cập nhật Database Schema

Chỉnh sửa `prisma/schema.prisma`, sau đó tạo migration:

```bash
npx prisma migrate dev --name feature_name
```

### 2. Tạo API Endpoints

Tạo hoặc cập nhật router trong `/src/server/api/routers/`, sau đó thêm vào root router.

### 3. Phát triển UI

- **Server Components**: Tạo async functions, fetch data trực tiếp
- **Client Components**: Thêm `"use client"`, sử dụng React hooks

### 4. Mẫu cho việc tạo Client Component

```tsx
"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function YourComponent() {
  // State và tRPC hooks
  const { data } = api.yourRouter.yourProcedure.useQuery();
  const utils = api.useUtils();
  const { mutate } = api.yourRouter.createProcedure.useMutation({
    onSuccess: () => {
      // Invalidate queries để refresh dữ liệu
      utils.yourRouter.yourProcedure.invalidate();
    }
  });

  return (
    // UI của bạn
  );
}
```

### 5. Mẫu cho việc tạo Server Component

```tsx
import { api, HydrateClient } from "~/trpc/server";
import { YourClientComponent } from "./_components/your-component";

export default async function YourPage() {
  // Server-side data fetching
  const data = await api.yourRouter.serverProcedure.query();

  // Prefetching for client
  void api.yourRouter.clientProcedure.prefetch();

  return (
    <HydrateClient>
      <div>
        {/* Server-rendered content */}
        <h1>{data.title}</h1>

        {/* Client component */}
        <YourClientComponent />
      </div>
    </HydrateClient>
  );
}
```

### 6. Mẫu cho việc Upload Hình ảnh với Cloudinary

```tsx
"use client";

import { uploadImageToCloudinary } from "~/lib/utils";

export function YourImageUploadComponent() {
  const handleImageUpload = async (file: File) => {
    try {
      const result = await uploadImageToCloudinary(file);
      console.log("Uploaded image URL:", result.url);

      // Tiếp tục xử lý, ví dụ: lưu vào database
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <div>
      <h2>Upload Image</h2>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
        }}
      />
    </div>
  );
}
```

## Các Nguyên tắc Quan trọng

1. **Type Safety**: Sử dụng TypeScript và tRPC để đảm bảo type safety.
2. **Hydration**: Luôn bọc client components bằng `<HydrateClient>`.
3. **Authentication**: Sử dụng `protectedProcedure` cho các API cần xác thực.
4. **Optimistic Updates**: Sử dụng invalidation và optimistic UI khi có thể.
5. **Performance**: Sử dụng prefetching để tối ưu hiệu suất.
6. **Image Management**: Sử dụng Cloudinary cho việc lưu trữ và quản lý hình ảnh.

## Debugging

### Server-side

- Logs xuất hiện trong terminal development server
- Check lỗi trong Network tab của DevTools

### Client-side

- React DevTools để debug component state
- Network tab để kiểm tra API calls
- Cloudinary uploads có thể được kiểm tra trong Network tab

## Cấu hình Cloudinary

Để cấu hình Cloudinary cho dự án:

1. Tạo tài khoản tại [cloudinary.com](https://cloudinary.com)
2. Tạo một upload preset không yêu cầu xác thực (unsigned)
   - Đi tới Settings > Upload
   - Tạo upload preset mới tên "instagram-clone"
   - Đặt Signing Mode thành "Unsigned"
3. Thêm các biến môi trường vào file `.env.local`:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=instagram-clone
   ```
