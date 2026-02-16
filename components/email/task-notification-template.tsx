import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import {
  main,
  container,
  header,
  logoBox,
  logoText,
  content,
  divider,
  bodyText,
  footer,
  footerDivider,
  footerText,
  footerSubtext,
} from './email-template'

interface TaskInfo {
  title: string
  description?: string | null
  priority: string
  dueDate?: string | null
}

interface TaskNotificationTemplateProps {
  userName: string
  projectTitle: string
  tasks: TaskInfo[]
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Baja', color: '#71717A' },
  MEDIUM: { label: 'Media', color: '#3B82F6' },
  HIGH: { label: 'Alta', color: '#F59E0B' },
  URGENT: { label: 'Urgente', color: '#EF4444' },
}

export function TaskNotificationTemplate({
  userName,
  projectTitle,
  tasks,
}: TaskNotificationTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Tareas asignadas - {projectTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <table
              role="presentation"
              width="100%"
              cellPadding={0}
              cellSpacing={0}
            >
              <tbody>
                <tr>
                  <td align="center">
                    <div style={logoBox}>X</div>
                    <Heading as="h1" style={logoText}>
                      XENITH
                    </Heading>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading as="h2" style={titleStyle}>
              Tareas asignadas
            </Heading>
            <Hr style={divider} />

            <Text style={bodyText}>Hola {userName},</Text>
            <Text style={{ ...bodyText, marginTop: '12px' }}>
              Se te han asignado tareas en el proyecto <strong style={{ color: '#F5920A' }}>{projectTitle}</strong>:
            </Text>

            {/* Tasks list */}
            {tasks.map((task, index) => {
              const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM
              return (
                <Section key={index} style={taskCard}>
                  <Text style={taskTitle}>{task.title}</Text>
                  {task.description && (
                    <Text style={taskDescription}>{task.description}</Text>
                  )}
                  <table role="presentation" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <tr>
                        <td style={{ paddingRight: '12px' }}>
                          <span style={{ ...badge, backgroundColor: `${priority.color}20`, color: priority.color }}>
                            {priority.label}
                          </span>
                        </td>
                        {task.dueDate && (
                          <td>
                            <span style={dateLabel}>{task.dueDate}</span>
                          </td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </Section>
              )
            })}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerText}>
              XENITH - Sistema de Gestion Integral
            </Text>
            <Text style={footerSubtext}>
              Este es un correo automatico. No responda a este correo.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ---------- Additional Styles ----------

const titleStyle: React.CSSProperties = {
  color: '#F5920A',
  fontSize: '20px',
  fontWeight: 600,
  margin: '0 0 4px 0',
  lineHeight: '1.4',
}

const taskCard: React.CSSProperties = {
  backgroundColor: '#18181B',
  border: '1px solid #27272A',
  borderRadius: '10px',
  padding: '16px 20px',
  marginTop: '16px',
}

const taskTitle: React.CSSProperties = {
  color: '#FAFAFA',
  fontSize: '15px',
  fontWeight: 600,
  margin: '0 0 4px 0',
}

const taskDescription: React.CSSProperties = {
  color: '#A1A1AA',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 10px 0',
}

const badge: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: '6px',
}

const dateLabel: React.CSSProperties = {
  color: '#A1A1AA',
  fontSize: '12px',
}
