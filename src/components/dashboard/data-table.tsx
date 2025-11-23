"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DataTableProps {
  title: string;
  data: any[];
}

export function DataTable({ title, data }: DataTableProps) {
  if (!data || data.length === 0) return null;

  // 动态获取表头 (取第一行数据的 keys)
  const headers = Object.keys(data[0]);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className="capitalize">
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  {headers.map((header) => (
                    <TableCell key={`${i}-${header}`}>
                      {/* 简单的逻辑：如果是状态字段，显示 Badge，否则显示文本 */}
                      {header.toLowerCase().includes("status") ? (
                        <Badge variant="secondary">{row[header]}</Badge>
                      ) : (
                        row[header]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
