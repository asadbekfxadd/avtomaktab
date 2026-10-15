import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHead } from "@/components/admin/ui";
import { LeadEditForm } from "@/components/admin/LeadEditForm";

export const metadata = { title: "Новая заявка" };

export default async function NewLead() {
  const me = await requireUser();
  const [managers, courses, branches] = await Promise.all([
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.course.findMany({ orderBy: { sort: "asc" } }),
    db.branch.findMany({ orderBy: { sort: "asc" } }),
  ]);
  return (
    <>
      <PageHead title="Новая заявка" sub="Для входящих звонков, Instagram, Telegram и визитов в офис" />
      <div className="a-card max-w-3xl p-5 sm:p-6">
        <LeadEditForm managers={managers} courses={courses} branches={branches} me={me} />
      </div>
    </>
  );
}
