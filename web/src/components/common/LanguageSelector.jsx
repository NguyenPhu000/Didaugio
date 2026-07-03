import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import { Button } from "@/components/ui";

const LANGUAGE_OPTIONS = [
  { value: "en", labelKey: "language.english", flag: "🇺🇸" },
  { value: "vi", labelKey: "language.vietnamese", flag: "🇻🇳" },
];

export function LanguageSelector({ variant = "ghost", size = "sm" }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";

  const handleChangeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
  };

  const currentOption = LANGUAGE_OPTIONS.find((opt) => opt.value === currentLang) || LANGUAGE_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5 px-2">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">
            {currentOption.flag} {currentOption.value.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleChangeLanguage(option.value)}
            className={currentLang === option.value ? "bg-accent" : ""}
          >
            <span className="mr-2">{option.flag}</span>
            <span>{t(option.labelKey)}</span>
            {currentLang === option.value && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
