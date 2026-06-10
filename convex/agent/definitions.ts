import type { ObjectType, PropertyValidators } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type AgentQueryDefinition<TArgs extends PropertyValidators, TReturn> = {
  args: TArgs
  handler: (ctx: QueryCtx, args: ObjectType<TArgs>) => TReturn
}

type AgentMutationDefinition<TArgs extends PropertyValidators, TReturn> = {
  args: TArgs
  handler: (ctx: MutationCtx, args: ObjectType<TArgs>) => TReturn
}

export function defineAgentQuery<TArgs extends PropertyValidators, TReturn>(
  definition: AgentQueryDefinition<TArgs, TReturn>
): AgentQueryDefinition<TArgs, TReturn> {
  return definition
}

export function defineAgentMutation<TArgs extends PropertyValidators, TReturn>(
  definition: AgentMutationDefinition<TArgs, TReturn>
): AgentMutationDefinition<TArgs, TReturn> {
  return definition
}
