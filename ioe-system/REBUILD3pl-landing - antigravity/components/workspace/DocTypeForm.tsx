"use client"

import React, { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Save, X, Loader2, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type FieldType = 'text' | 'select' | 'date' | 'number' | 'textarea' | 'email' | 'url' | 'phone'

export interface FormFieldConfig {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  description?: string
  options?: { value: string; label: string }[]
  defaultValue?: any
  disabled?: boolean
  readonly?: boolean
  section?: string
  colspan?: number
}

export interface FormSection {
  label: string
  fields: string[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface ChildTableConfig {
  name: string
  label: string
  columns: FormFieldConfig[]
  addRowLabel?: string
}

export interface DocTypeFormProps {
  doctype: string
  recordId?: string
  mode: 'new' | 'edit' | 'view'
  fields: FormFieldConfig[]
  sections?: FormSection[]
  childTables?: ChildTableConfig[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  initialData?: any
  isLoading?: boolean
  actions?: Array<{
    label: string
    action: (data: any) => Promise<void> | void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  }>
}

export function DocTypeForm({
  doctype,
  recordId,
  mode,
  fields,
  sections = [],
  childTables = [],
  onSubmit,
  onCancel,
  initialData = {},
  isLoading = false,
  actions = [],
}: DocTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
    sections.reduce((acc, section) => {
      if (section.defaultCollapsed) {
        acc[section.label] = true
      }
      return acc
    }, {} as Record<string, boolean>)
  )

  const defaultValues = fields.reduce((acc, field) => {
    acc[field.name] = initialData[field.name] ?? field.defaultValue ?? ''
    return acc
  }, {} as Record<string, any>)

  const form = useForm({
    defaultValues,
    mode: 'onChange',
  })

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      Object.keys(initialData).forEach((key) => {
        form.setValue(key, initialData[key])
      })
    }
  }, [initialData, form])

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSection = (sectionLabel: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionLabel]: !prev[sectionLabel],
    }))
  }

  const renderField = (field: FormFieldConfig) => {
    const isReadonly = mode === 'view' || field.readonly
    const isDisabled = field.disabled || isReadonly

    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        rules={{
          required: field.required ? `${field.label} is required` : false,
        }}
        render={({ field: formField }) => (
          <FormItem className={field.colspan === 2 ? 'col-span-2' : ''}>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {field.type === 'select' ? (
                <Select
                  value={formField.value || ''}
                  onValueChange={formField.onChange}
                  disabled={isDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  {...formField}
                  placeholder={field.placeholder}
                  disabled={isDisabled}
                  readOnly={isReadonly}
                  rows={4}
                />
              ) : (
                <Input
                  {...formField}
                  type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                  placeholder={field.placeholder}
                  disabled={isDisabled}
                  readOnly={isReadonly}
                />
              )}
            </FormControl>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  const getFieldsForSection = (section: FormSection) => {
    return fields.filter((field) => section.fields.includes(field.name))
  }

  const groupedFields = sections.length > 0
    ? sections.map((section) => ({
        section,
        fields: getFieldsForSection(section),
      }))
    : [{ section: null, fields }]

  const isReadonly = mode === 'view'

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Form Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {mode === 'new' ? `New ${doctype}` : mode === 'edit' ? `Edit ${doctype}` : doctype}
            </h2>
            {recordId && (
              <p className="text-sm text-gray-500 mt-1">ID: {recordId}</p>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {groupedFields.map(({ section, fields: sectionFields }, idx) => (
            <Card key={section?.label || 'default'} className="border border-gray-200">
              {section && (
                <CardHeader
                  className={`cursor-pointer ${section.collapsible ? 'hover:bg-gray-50' : ''}`}
                  onClick={() => section.collapsible && toggleSection(section.label)}
                >
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {section.label}
                    {section.collapsible && (
                      <span className="ml-2 text-sm text-gray-500">
                        {collapsedSections[section.label] ? '▼' : '▲'}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
              )}
              {(!section || !collapsedSections[section.label]) && (
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sectionFields.map((field) => renderField(field))}
                  </div>
                </CardContent>
              )}
              {idx < groupedFields.length - 1 && <Separator className="my-4" />}
            </Card>
          ))}
        </div>

        {/* Child Tables */}
        {childTables.map((childTable) => (
          <Card key={childTable.name} className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {childTable.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">
                Child table implementation for {childTable.name}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Form Actions */}
        {!isReadonly && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
            {actions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      onClick={async () => {
                        const data = form.getValues()
                        await action.action(data)
                      }}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </form>
    </FormProvider>
  )
}

