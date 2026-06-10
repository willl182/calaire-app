import type { ObjectType, PropertyValidators } from 'convex/values'
import type { MutationCtx, QueryCtx } from '../_generated/server'

type RondaQueryDefinition<TArgs extends PropertyValidators, TReturn> = {
  args: TArgs
  handler: (ctx: QueryCtx, args: ObjectType<TArgs>) => TReturn
}

type RondaMutationDefinition<TArgs extends PropertyValidators, TReturn> = {
  args: TArgs
  handler: (ctx: MutationCtx, args: ObjectType<TArgs>) => TReturn
}

export function defineRondaQuery<TArgs extends PropertyValidators, TReturn>(
  definition: RondaQueryDefinition<TArgs, TReturn>
): RondaQueryDefinition<TArgs, TReturn> {
  return definition
}

export function defineRondaMutation<TArgs extends PropertyValidators, TReturn>(
  definition: RondaMutationDefinition<TArgs, TReturn>
): RondaMutationDefinition<TArgs, TReturn> {
  return definition
}
