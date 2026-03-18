import { BackgroundRemover } from "@/components/editor/BackgroundRemover";

export default function RemoveBgPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">背景除去</h1>
        <p className="text-gray-500 mt-1">
          AIで商品画像の背景を除去します。透過PNG・白背景・カスタム背景に変換可能です。
        </p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <BackgroundRemover />
      </div>
    </div>
  );
}
