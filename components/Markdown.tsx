"use client"

import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import remarkGfm from "remark-gfm"

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
})

export default function Markdown({
  children,
  className,
}: {
  children?: string
  className?: string
}) {
  return (
    <section
      className={cn(
        "[&_strong]:font-semibold min-h-[42vh] leading-relaxed",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-4 mb-3" {...props} />
          ),
          // No Separators
          hr: () => null,
          a: ({ node, target, ...props }) => (
            <a
              {...props}
              className="text-ut-purple underline underline-offset-4 break-all"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          h2: ({ node, ...props }) => (
            <h1 className="text-xl font-bold mt-5 mb-2" {...props} />
          ),
          li: ({ node, children, ...props }) => (
            <li className="flex my-2" {...props}>
              <div className="size-1.5 m-2.5 bg-black shrink-0 rounded-full" />
              <p className="block">{children}</p>
            </li>
          ),
        }}
      >
        {children || ""}
      </ReactMarkdown>
    </section>
  )
}
