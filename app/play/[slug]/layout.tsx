export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await Promise.resolve(params); // 确保 params 是异步的
  
  // Cambiar el título específicamente para so-arm100
  const title = slug === 'so-arm100' ? '101 ARM CPF' : `Play with ${slug}`;
  
  return {
    title,
    description: `${slug} simulation and control`,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
