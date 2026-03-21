import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@vicino/shared";
import { getOrCreateChat } from "./actions";

export const metadata = {
  title: "Chat",
};

interface Props {
  searchParams: Promise<{ seller?: string; product?: string }>;
}

export default async function ChatPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/chat");

  // If seller param is present, create/get chat and redirect
  if (params.seller) {
    const result = await getOrCreateChat(params.seller, params.product);
    if (result.chatId) {
      redirect(`/chat/${result.chatId}`);
    }
  }

  // Get user's chats
  const { data: chats } = await supabase
    .from("chats")
    .select(
      `
      id, updated_at, no_leidos_comprador, no_leidos_vendedor,
      comprador:profiles!comprador_id(id, nombre, foto),
      vendedor:profiles!vendedor_id(id, nombre, foto),
      ultimo_producto:products_services!ultimo_producto_id(titulo)
    `
    )
    .or(`comprador_id.eq.${user.id},vendedor_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">Mensajes</h1>

      {chats && chats.length > 0 ? (
        <div className="divide-y">
          {chats.map((chat) => {
            const compradorProfile = Array.isArray(chat.comprador) ? chat.comprador[0] : chat.comprador;
            const vendedorProfile = Array.isArray(chat.vendedor) ? chat.vendedor[0] : chat.vendedor;
            const isBuyer = compradorProfile?.id === user.id;
            const otherProfile = isBuyer ? vendedorProfile : compradorProfile;
            const unread = isBuyer
              ? chat.no_leidos_comprador
              : chat.no_leidos_vendedor;
            const producto = Array.isArray(chat.ultimo_producto)
              ? chat.ultimo_producto[0]
              : chat.ultimo_producto;

            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="flex items-center gap-3 py-3 hover:bg-accent/50 -mx-2 px-2 rounded-md transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium">
                    {otherProfile?.nombre?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">
                      {otherProfile?.nombre ?? "Usuario"}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatRelativeTime(chat.updated_at)}
                    </span>
                  </div>
                  {producto?.titulo && (
                    <p className="text-xs text-muted-foreground truncate">
                      {producto.titulo}
                    </p>
                  )}
                </div>
                {unread > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">💬</p>
          <p className="font-medium">Sin conversaciones</p>
          <p className="text-sm text-muted-foreground">
            Tus chats con vendedores y compradores aparecerán aquí
          </p>
        </div>
      )}
    </div>
  );
}
