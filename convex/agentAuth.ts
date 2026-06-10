import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const createClaim = mutation({
  args: {
    claimTokenHash: v.string(),
    claimViewTokenHash: v.string(),
    email: v.string(),
    claimExpiresAt: v.number(),
    scopes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('agentAuthClaims', {
      claimTokenHash: args.claimTokenHash,
      claimViewTokenHash: args.claimViewTokenHash,
      email: args.email.toLowerCase(),
      status: 'pending',
      otpHash: null,
      otpExpiresAt: null,
      claimExpiresAt: args.claimExpiresAt,
      claimedAt: null,
      apiKeyHash: null,
      apiKeyExpiresAt: null,
      scopes: args.scopes,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const getClaimByTokenHash = query({
  args: { claimTokenHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('agentAuthClaims')
      .withIndex('by_claim_token_hash', (q) => q.eq('claimTokenHash', args.claimTokenHash))
      .unique()
  },
})

export const getClaimByViewTokenHash = query({
  args: { claimViewTokenHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('agentAuthClaims')
      .withIndex('by_claim_view_token_hash', (q) => q.eq('claimViewTokenHash', args.claimViewTokenHash))
      .unique()
  },
})

export const getApiKeyRecord = query({
  args: { apiKeyHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('agentApiKeys')
      .withIndex('by_api_key_hash', (q) => q.eq('apiKeyHash', args.apiKeyHash))
      .unique()
  },
})

export const rotateOtp = mutation({
  args: {
    claimId: v.id('agentAuthClaims'),
    otpHash: v.string(),
    otpExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.claimId)
    if (!claim) return null
    await ctx.db.patch(args.claimId, {
      otpHash: args.otpHash,
      otpExpiresAt: args.otpExpiresAt,
      updatedAt: Date.now(),
    })
    return true
  },
})

export const completeClaim = mutation({
  args: {
    claimId: v.id('agentAuthClaims'),
    apiKeyHash: v.string(),
    apiKeyExpiresAt: v.number(),
    claimCompletedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.claimId)
    if (!claim) return null
    await ctx.db.patch(args.claimId, {
      status: 'claimed',
      claimedAt: args.claimCompletedAt,
      apiKeyHash: args.apiKeyHash,
      apiKeyExpiresAt: args.apiKeyExpiresAt,
      updatedAt: Date.now(),
    })
    await ctx.db.insert('agentApiKeys', {
      apiKeyHash: args.apiKeyHash,
      claimId: args.claimId,
      email: claim.email,
      scopes: claim.scopes,
      expiresAt: args.apiKeyExpiresAt,
      revokedAt: null,
      createdAt: args.claimCompletedAt,
    })
    return true
  },
})
