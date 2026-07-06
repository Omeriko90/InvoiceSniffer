"use client"

import { toast } from "sonner"
import {
  BellIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  InfoIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="rounded-xl border bg-card p-6">{children}</div>
    </section>
  )
}

export default function PreviewPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">UI components</h1>
        <p className="text-sm text-muted-foreground">
          Every component in <code className="font-mono">src/components/ui</code>,
          rendered with the app design tokens.
        </p>
      </header>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add">
            <PlusIcon />
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </Section>

      <Section title="Alerts">
        <div className="space-y-4">
          <Alert>
            <InfoIcon />
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>
              Gmail sync runs every 15 minutes. New invoices appear on the
              dashboard automatically.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Reconciliation failed</AlertTitle>
            <AlertDescription>
              3 transactions could not be matched to an invoice.
            </AlertDescription>
          </Alert>
        </div>
      </Section>

      <Section title="Avatars">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>OD</AvatarFallback>
          </Avatar>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid max-w-md gap-6">
          <div className="grid gap-2">
            <Label htmlFor="preview-email">Email</Label>
            <Input id="preview-email" type="email" placeholder="you@company.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="preview-notes">Notes</Label>
            <Textarea id="preview-notes" placeholder="Add a note about this invoice…" />
          </div>
          <div className="grid gap-2">
            <Label>Bank account</Label>
            <Select defaultValue="Operating account">
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operating account">Operating account</SelectItem>
                <SelectItem value="Payroll account">Payroll account</SelectItem>
                <SelectItem value="Savings account">Savings account</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="preview-check" defaultChecked />
            <Label htmlFor="preview-check">Auto-match exact amounts</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="preview-switch" defaultChecked />
            <Label htmlFor="preview-switch">Email notifications</Label>
          </div>
          <div className="grid gap-2">
            <Label>Match strategy</Label>
            <RadioGroup defaultValue="strict" className="gap-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="strict" id="preview-strict" />
                <Label htmlFor="preview-strict">Strict (amount + date)</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fuzzy" id="preview-fuzzy" />
                <Label htmlFor="preview-fuzzy">Fuzzy (amount only)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </Section>

      <Section title="Card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Monthly summary</CardTitle>
            <CardDescription>June 2026</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            42 invoices processed, 39 reconciled automatically.
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="outline">
              View report
            </Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Acme Cloud</TableCell>
              <TableCell>$1,200.00</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  <CheckCircle2Icon /> Reconciled
                </Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Papertrail Ltd</TableCell>
              <TableCell>$89.50</TableCell>
              <TableCell>
                <Badge variant="destructive">Unmatched</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="invoices">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>
          <TabsContent value="invoices" className="pt-4 text-sm text-muted-foreground">
            Invoice list goes here.
          </TabsContent>
          <TabsContent value="transactions" className="pt-4 text-sm text-muted-foreground">
            Transaction list goes here.
          </TabsContent>
          <TabsContent value="rules" className="pt-4 text-sm text-muted-foreground">
            Learned rules go here.
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger render={<Button variant="outline">Dialog</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete invoice?</DialogTitle>
                <DialogDescription>
                  This removes the invoice and its match history. This cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive">Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger render={<Button variant="outline">Sheet</Button>} />
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Invoice details</SheetTitle>
                <SheetDescription>
                  Side panel for drill-down views.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <Popover>
            <PopoverTrigger render={<Button variant="outline">Popover</Button>} />
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Quick filter</PopoverTitle>
                <PopoverDescription>
                  Anchored content for lightweight actions.
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline">
                  Dropdown <ChevronDownIcon />
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger render={<Button variant="outline">Tooltip</Button>} />
            <TooltipContent>Helpful hint text</TooltipContent>
          </Tooltip>
        </div>
      </Section>

      <Section title="Feedback">
        <div className="max-w-md space-y-6">
          <Progress value={65}>
            <ProgressLabel>Sync progress</ProgressLabel>
            <ProgressValue />
          </Progress>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Separator />
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => toast.success("Invoice reconciled")}
            >
              <BellIcon /> Success toast
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.error("Could not match transaction")}
            >
              Error toast
            </Button>
          </div>
        </div>
      </Section>
    </div>
  )
}
