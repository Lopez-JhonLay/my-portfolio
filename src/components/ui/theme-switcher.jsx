import { useTheme } from "../../contexts/theme-context";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex gap-3">
      <label className="relative inline-flex items-center cursor-pointer">
        {/* Native Switch Input (Hidden) */}
        <input
          type="checkbox"
          checked={isDark}
          onChange={() => setTheme(isDark ? "light" : "dark")}
          className="sr-only"
        />

        {/* Custom Switch */}
        <div
          className={cn(
            "w-12 h-6 bg-gray-300 dark:bg-gray-800 rounded-full p-1 flex items-center transition-colors"
          )}
        >
          {/* Toggle Thumb with Icon */}
          <div
            className={cn(
              "w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center transition-transform",
              isDark ? "translate-x-6" : "translate-x-0"
            )}
          >
            {isDark ? (
              <Moon className="w-4 h-4 text-gray-800" />
            ) : (
              <Sun className="w-4 h-4 text-yellow-500" />
            )}
          </div>
        </div>
      </label>
    </div>
  );
}
