import { redirect } from "next/navigation";

interface Props {
	params: Promise<{ orgId: string }>;
}

export default async function OrganizationDetailPage({ params }: Props) {
	const { orgId } = await params;

	// Redirecionar para a página de membros por padrão
	redirect(`/organization/${orgId}/members`);
}
