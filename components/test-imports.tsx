import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table } from "@/components/ui/table"
import { Tabs } from "@/components/ui/tabs"

export function TestImports() {
  return (
    <div>
      <h1>Test Imports</h1>
      <Card>
        <CardContent>
          <Button>Test Button</Button>
          <Input placeholder="Test Input" />
          <Table>
            <tbody>
              <tr>
                <td>Test Table</td>
              </tr>
            </tbody>
          </Table>
          <Tabs defaultValue="tab1">
            <div>Test Tabs</div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
