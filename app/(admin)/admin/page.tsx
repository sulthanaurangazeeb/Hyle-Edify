import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const [studentCount, enrollmentCount, revenue, recentPayments] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.enrollment.count({ where: { status: "ACTIVE" } }),
      prisma.payment.aggregate({
        where: { status: "CAPTURED" },
        _sum: { amountInPaise: true },
      }),
      prisma.payment.findMany({
        where: { status: "CAPTURED" },
        include: {
          user: { select: { email: true, fullName: true } },
          course: { select: { title: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    ]);

  const stats = [
    { label: "Students", value: String(studentCount) },
    { label: "Active enrollments", value: String(enrollmentCount) },
    {
      label: "Total revenue",
      value: formatInr(revenue._sum.amountInPaise ?? 0),
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-hyle-navy">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-hyle-navy">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-hyle-navy">
          Recent payments
        </h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Student</th>
                  <th className="p-3 font-medium">Course</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-muted-foreground">
                      No payments yet.
                    </td>
                  </tr>
                )}
                {recentPayments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3">{p.user.fullName ?? p.user.email}</td>
                    <td className="p-3">{p.course.title}</td>
                    <td className="p-3 font-medium">
                      {formatInr(p.amountInPaise)}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {p.updatedAt.toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
