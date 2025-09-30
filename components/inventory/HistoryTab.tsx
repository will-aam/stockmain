import type React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { History } from "lucide-react";

export const HistoryTab: React.FC = () => {
  return (
    <Card className="opacity-60">
      <CardHeader>
        <CardTitle className="flex items-center">
          <History className="h-5 w-5 mr-2" />
          Histórico de Contagens
        </CardTitle>
        <CardDescription>
          Visualize o histórico de contagens anteriores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Histórico não disponível</p>
          <p className="text-sm">
            Faça upgrade para premium para acessar este recurso
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

HistoryTab.displayName = "HistoryTab";
