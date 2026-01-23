import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import CreateOrganizationForm from "./create-organization-form";

export default function CreateOrganizationPage() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full overflow-hidden bg-[#0D0D0D]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center px-6 py-16">
        <div className="w-full">
          <Link
            href="/organization"
            className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
          >
            &larr; Voltar
          </Link>

          <Card>
            <CardHeader className="border-white/5 border-b px-8 pt-8 pb-4">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Criar nova organização
              </h1>
              <p className="mt-2 text-sm text-white/60">
                Configure seu espaço de trabalho. Você poderá convidar membros e
                alterar configurações depois.
              </p>
            </CardHeader>
            <CardContent className="bg-black/20 p-8">
              <CreateOrganizationForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
