```shell
npx copilotkit@latest create -f langgraph-py
 cd .\chatbi
bun install

bun dev:ui

bun install @radix-ui/react-dialog @radix-ui/react-slot @radix-ui/react-scroll-area @radix-ui/react-label @radix-ui/react-avatar

bunx --bun shadcn@latest init
bunx --bun shadcn@latest add resizable scroll-area separator button card sheet avatar
```