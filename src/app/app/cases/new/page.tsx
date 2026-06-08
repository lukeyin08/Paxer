import { requireUser } from '@/lib/auth/session';
import { Kicker } from '@/components/brand/kicker';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ManualCaseForm } from './manual-case-form';
import { UploadForm } from './upload-connect-forms';

export default async function NewCasePage() {
  await requireUser();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 animate-fade-up">
      <div>
        <Kicker className="mb-2">New case</Kicker>
        <h1 className="font-sans text-3xl font-semibold">Add a case</h1>
        <p className="mt-1 text-muted">
          Upload a bill or EOB, or enter charges by hand.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="upload">
            <TabsList>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="manual">Manual entry</TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <UploadForm />
            </TabsContent>
            <TabsContent value="manual">
              <ManualCaseForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
