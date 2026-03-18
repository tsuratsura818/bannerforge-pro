export function LoadingSpinner({ text = "生成中..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
        <div className="absolute inset-0 rounded-full border-4 border-t-[#1A1A2E] dark:border-t-blue-500 animate-spin" />
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">
        {text}
      </p>
    </div>
  );
}
