import {describe, expect, test} from 'bun:test'
import {getFunctionName} from 'convex/server'
import {internal} from '../convex/_generated/api'
import type {Doc, Id} from '../convex/_generated/dataModel'
import {createOrUpdateUser} from '../convex/users/m'

const createOrUpdateUserHandler = (
  createOrUpdateUser as unknown as {
    _handler: (
      ctx: {
        db: {
          query: (table: string) => {
            withIndex: (
              indexName: string,
              cb: unknown,
            ) => {unique: () => Promise<Doc<'users'> | null>}
            unique?: never
          }
          insert: (table: string, value: Record<string, unknown>) => Promise<Id<'users'>>
          patch: (id: Id<'users'>, value: Record<string, unknown>) => Promise<void>
          get: (id: Id<'users'>) => Promise<Doc<'users'> | null>
        }
        scheduler: {
          runAfter: (
            delayMs: number,
            functionRef: unknown,
            args: Record<string, unknown>,
          ) => Promise<unknown>
        }
      },
      args: {
        email: string
        name: string
        firebaseId: string
        photoUrl?: string
      },
    ) => Promise<Id<'users'>>
  }
)._handler

describe('createOrUpdateUser welcome email scheduling', () => {
  test('schedules signup activity and welcome email for a newly created user', async () => {
    const insertedUserId = 'ns_new_user_signup_test' as Id<'users'>
    const insertCalls: Array<{table: string; value: Record<string, unknown>}> = []
    const schedulerCalls: Array<{
      delayMs: number
      functionName: string
      args: Record<string, unknown>
    }> = []

    const ctx = {
      db: {
        query: (table: string) => {
          expect(table).toBe('users')
          return {
            withIndex: (indexName: string, _cb: unknown) => {
              expect(indexName).toBe('by_email')
              return {
                unique: async () => null,
              }
            },
          }
        },
        insert: async (table: string, value: Record<string, unknown>) => {
          insertCalls.push({table, value})
          return insertedUserId
        },
        patch: async () => {},
        get: async () => null,
      },
      scheduler: {
        runAfter: async (
          delayMs: number,
          functionRef: unknown,
          args: Record<string, unknown>,
        ) => {
          schedulerCalls.push({
            delayMs,
            functionName: getFunctionName(functionRef as never),
            args,
          })
          return null
        },
      },
    }

    const result = await createOrUpdateUserHandler(ctx, {
      email: 'new-user@example.com',
      name: 'New User',
      firebaseId: 'firebase-user-123',
    })

    expect(result).toBe(insertedUserId)
    expect(insertCalls).toHaveLength(1)
    expect(insertCalls[0]?.table).toBe('users')
    expect(insertCalls[0]?.value).toMatchObject({
      email: 'new-user@example.com',
      name: 'New User',
      firebaseId: 'firebase-user-123',
      fid: 'firebase-user-123',
    })
    expect(typeof insertCalls[0]?.value.createdAt).toBe('number')
    expect(typeof insertCalls[0]?.value.updatedAt).toBe('number')

    expect(schedulerCalls).toEqual([
      {
        delayMs: 0,
        functionName: getFunctionName(internal.activities.m.logUserSignup),
        args: {
          userId: insertedUserId,
          userName: 'New User',
          userEmail: 'new-user@example.com',
        },
      },
      {
        delayMs: 0,
        functionName: getFunctionName(internal.users.a.sendWelcomeEmailForUser),
        args: {
          userId: insertedUserId,
        },
      },
    ])
  })

  test('does not reschedule the welcome email for an existing user', async () => {
    const existingUserId = 'ns_existing_user_signup_test' as Id<'users'>
    const existingUser = {
      _id: existingUserId,
      _creationTime: Date.now() - 1_000,
      email: 'existing@example.com',
      name: 'Existing User',
      firebaseId: 'firebase-user-existing',
      fid: 'firebase-user-existing',
      createdAt: Date.now() - 1_000,
      updatedAt: Date.now() - 1_000,
    } as Doc<'users'>
    const patchCalls: Array<{id: Id<'users'>; value: Record<string, unknown>}> =
      []
    const schedulerCalls: Array<unknown> = []

    const ctx = {
      db: {
        query: (table: string) => {
          expect(table).toBe('users')
          return {
            withIndex: (indexName: string, _cb: unknown) => {
              expect(indexName).toBe('by_email')
              return {
                unique: async () => existingUser,
              }
            },
          }
        },
        insert: async () => {
          throw new Error('insert should not be called for existing users')
        },
        patch: async (id: Id<'users'>, value: Record<string, unknown>) => {
          patchCalls.push({id, value})
        },
        get: async () => existingUser,
      },
      scheduler: {
        runAfter: async (...args: unknown[]) => {
          schedulerCalls.push(args)
          return null
        },
      },
    }

    const result = await createOrUpdateUserHandler(ctx, {
      email: 'existing@example.com',
      name: 'Existing User',
      firebaseId: 'firebase-user-existing',
      photoUrl: 'https://example.com/avatar.png',
    })

    expect(result).toBe(existingUserId)
    expect(patchCalls).toHaveLength(1)
    expect(patchCalls[0]?.id).toBe(existingUserId)
    expect(patchCalls[0]?.value).toMatchObject({
      email: 'existing@example.com',
      name: 'Existing User',
      fid: 'firebase-user-existing',
      photoUrl: 'https://example.com/avatar.png',
    })
    expect(typeof patchCalls[0]?.value.updatedAt).toBe('number')
    expect(schedulerCalls).toHaveLength(0)
  })
})
