import { CropTool } from "@/components/editor/CropTool";

export default function CropPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">切り抜き</h1>
        <p className="text-gray-500 mt-1">画像を指定したサイズにクロップします。</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <CropTool />
      </div>
    </div>
  );
}
