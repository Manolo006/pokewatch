import PublicProfileClient from "./PublicProfileClient";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ username: "profile" }];
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  return <PublicProfileClient params={params} />;
}
