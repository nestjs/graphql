import {
  GraphQLArgument,
  GraphQLInputField,
  GraphQLInputType,
  GraphQLSchema,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
} from 'graphql';

type DefaultValueHolder = (GraphQLArgument | GraphQLInputField) & {
  default?: { value?: unknown };
};

/**
 * graphql-js hands the default value of an argument or input field to the
 * resolver as it is, while a value sent by the client is coerced against its
 * type: the input fields it leaves out take their own default values, and a
 * single item given for a list becomes a list. A declared default such as
 * `filter: PostFilter = {}` would then reach the resolver without the field
 * defaults the same `{}` gets when a client sends it (or when the schema is
 * rebuilt from its SDL, as the federation drivers do).
 *
 * Completes the declared default values the same way, once the schema is
 * built (the input types a default refers to cannot be read while the fields
 * of the input types are still being generated).
 */
export function completeDefaultValues(schema: GraphQLSchema): GraphQLSchema {
  for (const type of Object.values(schema.getTypeMap())) {
    if (isObjectType(type) || isInterfaceType(type)) {
      for (const field of Object.values(type.getFields())) {
        field.args.forEach(completeElementDefaultValue);
      }
    } else if (isInputObjectType(type)) {
      Object.values(type.getFields()).forEach(completeElementDefaultValue);
    }
  }
  return schema;
}

function completeElementDefaultValue(
  element: GraphQLArgument | GraphQLInputField,
) {
  const completedValue = completeDefaultValue(
    element.defaultValue,
    element.type,
    new Set(),
  );
  if (completedValue === element.defaultValue) {
    return;
  }
  element.defaultValue = completedValue;

  // graphql v17 reads the default from "default" (see "backfillDefaultValues")
  const holder = element as DefaultValueHolder;
  if (holder.default && 'value' in holder.default) {
    holder.default = { value: completedValue };
  }
}

/**
 * Returns the value itself when there is nothing to complete. Enum and scalar
 * values stay in their internal form. "expandedFields" holds the input fields
 * whose default value is being expanded, so that a default value that refers
 * to its own type (e.g., `next: Node = {}`) is expanded only once.
 */
function completeDefaultValue(
  value: unknown,
  type: GraphQLInputType,
  expandedFields: Set<GraphQLInputField>,
): unknown {
  if (value === undefined || value === null) {
    return value;
  }
  if (isNonNullType(type)) {
    return completeDefaultValue(value, type.ofType, expandedFields);
  }
  if (isListType(type)) {
    if (!Array.isArray(value)) {
      return [completeDefaultValue(value, type.ofType, expandedFields)];
    }
    const items = value.map((item) =>
      completeDefaultValue(item, type.ofType, expandedFields),
    );
    return items.every((item, index) => item === value[index]) ? value : items;
  }
  if (
    !isInputObjectType(type) ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return value;
  }

  const inputObject = value as Record<string, unknown>;
  let completedValue = inputObject;
  for (const field of Object.values(type.getFields())) {
    const fieldValue = inputObject[field.name];
    let completedFieldValue = fieldValue;
    if (fieldValue !== undefined) {
      completedFieldValue = completeDefaultValue(
        fieldValue,
        field.type,
        expandedFields,
      );
    } else if (!expandedFields.has(field)) {
      expandedFields.add(field);
      completedFieldValue = completeDefaultValue(
        field.defaultValue,
        field.type,
        expandedFields,
      );
      expandedFields.delete(field);
    }
    if (completedFieldValue === fieldValue) {
      continue;
    }
    if (completedValue === inputObject) {
      // Copy on write, keeping the prototype (e.g., of an @InputType() class)
      completedValue = Object.assign(
        Object.create(Object.getPrototypeOf(inputObject)),
        inputObject,
      );
    }
    completedValue[field.name] = completedFieldValue;
  }
  return completedValue;
}
