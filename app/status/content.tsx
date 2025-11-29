'use client'

import {Timeline} from '@/components/ui/timeline'
import {cn} from '@/lib/utils'
import {Circle} from 'lucide-react'

import {Icon} from '@/lib/icons'
import {motion} from 'motion/react'
import {ProtectedModal} from '../_components/protected-modal'

interface TaskItemProps {
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'pending' | 'started'
  index: number
}

function TaskItem({title, description, status, index}: TaskItemProps) {
  return (
    <motion.div
      initial={{opacity: 0, x: -20}}
      whileInView={{opacity: 1, x: 0}}
      transition={{delay: index * 0.1, duration: 0.5}}
      viewport={{once: true}}
      className='group relative pl-8 pb-8 border-l border-neutral-200 dark:border-neutral-800 last:border-0 last:pb-0'>
      <div className='absolute left-[-9px] top-0 bg-neutral-50 dark:bg-neutral-950 rounded-full'>
        {status === 'completed' && (
          <Icon name='check-fill' className='size-6 text-teal-500' />
        )}
        {status === 'in-progress' && (
          <div className='relative'>
            <div className='absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75'></div>
            <Circle className='size-6 text-blue-500 fill-blue-500' />
          </div>
        )}
        {status === 'pending' && (
          <Icon
            name='check-ring-light'
            className='size-6 text-neutral-300 dark:text-neutral-700'
          />
        )}
        {status === 'started' && (
          <Icon
            name='circle-in'
            className='size-6 text-amber-500 dark:text-amber-700'
          />
        )}
      </div>
      <div className='mb-1 flex items-center gap-2'>
        <h4
          className={cn(
            'font-semibold text-base',
            status === 'completed'
              ? 'text-neutral-900 dark:text-neutral-100'
              : status === 'in-progress'
                ? 'text-blue-600 dark:text-blue-400'
                : status === 'started'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-neutral-500 dark:text-neutral-500',
          )}>
          {title}
        </h4>
        {status === 'in-progress' && (
          <span className='text-[10px] uppercase tracking-wider font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full'>
            In Progress
          </span>
        )}
        {status === 'started' && (
          <span className='text-[10px] uppercase tracking-wider font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full'>
            Started
          </span>
        )}
      </div>
      <p className='text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl'>
        {description}
      </p>
    </motion.div>
  )
}

export function Content() {
  const data = [
    {
      title: 'Phase 0',
      content: (
        <div>
          <div className='flex items-center gap-3 mb-4'>
            <span className='text-indigo-600 dark:text-neutral-400 text-lg tracking-tight'>
              8 days estimate
            </span>
          </div>
          <p className='mb-8 text-neutral-600 dark:text-neutral-400 text-base md:text-lg'>
            Initial project setup and foundational design work completed at
            contract agreement.
          </p>
          <div className='bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm'>
            <TaskItem
              index={0}
              status='completed'
              title='Layout Design'
              description='Defines the overall visual structure and hierarchy of the website, ensuring intuitive navigation, responsive scaling, and aesthetic balance across all devices.'
            />
            <TaskItem
              index={1}
              status='completed'
              title='Web Elements and Design System Selection'
              description='Establishes consistent UI components, typography, and color schemes using a chosen design system or library to maintain visual uniformity and scalability.'
            />
            <TaskItem
              index={2}
              status='completed'
              title='Web Framework and Systems Analysis'
              description='Evaluates and selects the most suitable frameworks, libraries, and architecture to support performance, maintainability, and integration needs.'
            />
            <TaskItem
              index={3}
              status='completed'
              title='DB Schema Design'
              description='Structures the database with clear relationships, data integrity rules, and optimized queries to support application logic and scalability.'
            />
            <TaskItem
              index={4}
              status='completed'
              title='Dry-run App Deploy'
              description='Performs a test deployment of the app in a controlled environment to validate configurations, detect deployment issues, and ensure smooth production release.'
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Phase 1',
      content: (
        <div>
          <div className='flex items-center gap-3 mb-4'>
            <span className='text-indigo-600 dark:text-neutral-400 text-lg tracking-tight'>
              3 weeks estimate
            </span>
          </div>
          <p className='mb-8 dark:text-neutral-400 text-base md:text-lg'>
            Core store features and user account functionality completed.
          </p>
          <div className='bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm'>
            <TaskItem
              index={0}
              status='completed'
              title='Store Landing Page'
              description='Serves as the main entry point of the shop, showcasing featured products, promotions, and brand highlights to engage visitors instantly.'
            />
            <TaskItem
              index={1}
              status='completed'
              title='Products and Category'
              description='Organizes all products into logical categories, enabling easy browsing, filtering, and discovery based on type, brand, or other attributes.'
            />
            <TaskItem
              index={2}
              status='completed'
              title='Account Registry and Add to Cart Feature'
              description='Allows users to create personal accounts for order tracking and preferences, while enabling seamless product selection and cart management for checkout.'
            />
            <TaskItem
              index={3}
              status='completed'
              title='Dry-run App Deploy'
              description='Executes a full test deployment in a staging environment to verify functionality, performance, and integration before the official launch.'
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Phase 2',
      content: (
        <div>
          <div className='flex items-center gap-3 mb-4'>
            <span className='text-indigo-600 dark:text-neutral-400 text-lg tracking-tight'>
              3 weeks estimate
            </span>
          </div>
          <p className='mb-8 text-neutral-600 dark:text-neutral-400 text-base md:text-lg'>
            Administrative tools and order management systems implemented.
          </p>
          <div className='bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm'>
            <TaskItem
              index={0}
              status='completed'
              title='Admin Panel Development'
              description='Builds a secure backend interface for managing products, orders, users, and site content with real-time visibility and control.'
            />
            <TaskItem
              index={1}
              status='completed'
              title='Mock Order Processing'
              description='Simulates the order lifecycle—from cart submission to confirmation—to validate payment flow, inventory logic, and notification systems.'
            />
            <TaskItem
              index={2}
              status='in-progress'
              title='User Access Controls'
              description='Implements role-based permissions to ensure that users, managers, and admins can only access features relevant to their authority level.'
            />
            <TaskItem
              index={3}
              status='pending'
              title='Domain Linking'
              description='Connects the live application to its registered domain, ensuring proper DNS configuration and SSL setup for secure, public access.'
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Phase 3',
      content: (
        <div>
          <div className='flex items-center gap-3 mb-4'>
            <span className='text-indigo-600 dark:text-neutral-400 text-lg tracking-tight'>
              4 weeks estimate
            </span>
          </div>
          <p className='mb-8 text-neutral-600 dark:text-neutral-400 text-base md:text-lg'>
            Final testing, quality assurance, and production launch preparation.
          </p>
          <div className='bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm transition-all duration-500'>
            <TaskItem
              index={0}
              status='started'
              title='Testing & QA'
              description='Conducts thorough functionality, usability, and performance tests to identify and fix bugs, ensuring the app meets quality standards.'
            />
            <TaskItem
              index={1}
              status='started'
              title='Pre-Launch Setup'
              description='Finalizes configurations, backups, and security measures while preparing deployment pipelines and production environments for release.'
            />
            <TaskItem
              index={2}
              status='pending'
              title='Production Project Launch'
              description='Officially deploys the finalized application to the live server, making it publicly accessible and fully operational for end users.'
            />
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className='relative w-full bg-white dark:bg-neutral-950'>
      <ProtectedModal storageKey='project-status' accessCode='069420' />
      <Timeline
        data={data}
        completion={82}
        title='Overall Project Status'
        description='Tracking the development progress from initial design to production
                launch.'
      />
    </div>
  )
}
