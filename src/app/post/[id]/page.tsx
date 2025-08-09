import { notFound } from "next/navigation";
import { PostDetail } from "~/app/_components/post";
import { api, HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";

interface PostPageProps {
  params: {
    id: string;
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const session = await auth();
  const { id } = params;

  if (session?.user && id) {
    void api.post.getById.prefetch({ id });
    void api.like.getLikeStatus.prefetch({ postId: id });
  }

  return (
    <HydrateClient>
      <PostDetail postId={id} />
    </HydrateClient>
  );
}
