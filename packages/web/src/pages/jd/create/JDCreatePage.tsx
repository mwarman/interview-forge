import { JSX, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/common/components/shadcn/tabs';
import { PasteMode } from './components/PasteMode';
import { UploadMode } from './components/UploadMode';

/**
 * JDCreatePage component - Main page for creating job descriptions.
 * Provides two input modes via tabs: paste (raw text) and upload (file).
 * On success, navigates to the job description list page.
 *
 * @returns {JSX.Element} The JDCreatePage component
 */
export const JDCreatePage = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/jds');
  };

  return (
    <div data-testid="jd-create-page" className="mx-auto max-w-2xl space-y-6 px-4 py-4 md:px-6">
      <div>
        <h1 className="text-2xl font-bold">Create Job Description</h1>
        <p className="mt-2 text-sm text-gray-600">Add a new job description by pasting text or uploading a file.</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'paste' | 'upload')}
        data-testid="jd-create-tabs"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paste" data-testid="paste-tab">
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="upload" data-testid="upload-tab">
            Upload File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="mt-6">
          <PasteMode onSuccess={handleSuccess} />
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <UploadMode onSuccess={handleSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
