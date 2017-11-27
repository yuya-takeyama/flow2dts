import {
  parse,
  TProgram,
  TStatement,
  TPattern,
  TFunctionDeclaration,
  TTypeAnnotation,
  TConcreteTypeAnnotation,
  TTypeParameterDeclaration,
  TImportSpecifier,
  TImportDefaultSpecifier,
  TImportNamespaceSpecifier,
  TExportSpecifier,
  TExportDefaultSpecifier,
  TExportNamespaceSpecifier,
  TTypeAlias,
  TObjectTypeProperty,
  TObjectTypeIndexer,
  TUnionTypeAnnotation,
  TFunctionTypeParam,
  TTypeParameterInstantiation,
  TFunctionTypeAnnotation,
} from 'flow-parser';
import { neverReachHere, position, indent } from './utils';

const typeAnotationTypeMap = {
  StringTypeAnnotation: 'string',
  NumberTypeAnnotation: 'number',
  BooleanTypeAnnotation: 'boolean',
  VoidTypeAnnotation: 'void',
  MixedTypeAnnotation: 'any',
  AnyTypeAnnotation: 'any',
  FunctionTypeAnnotation: 'Function',
};

const transformConcreteTypeAnnotation = (
  typeAnnotation: TConcreteTypeAnnotation,
): string => {
  switch (typeAnnotation.type) {
    case 'StringTypeAnnotation':
    case 'NumberTypeAnnotation':
    case 'BooleanTypeAnnotation':
    case 'VoidTypeAnnotation':
    case 'MixedTypeAnnotation':
    case 'AnyTypeAnnotation':
      return typeAnotationTypeMap[typeAnnotation.type];

    case 'FunctionTypeAnnotation':
      return (
        `(${transformFunctionTypeParameters(typeAnnotation.params)}) => ` +
        `${
          typeAnnotation.returnType
            ? transformConcreteTypeAnnotation(typeAnnotation.returnType)
            : 'void'
        }`
      );

    case 'GenericTypeAnnotation':
      if (typeAnnotation.id.name === 'Object') {
        return 'object';
      } else {
        return `${typeAnnotation.id.name}${transformTypeParameterInstantiation(
          typeAnnotation.typeParameters,
        )}`;
      }

    case 'UnionTypeAnnotation':
      return transformUnionTypeAnnotation(typeAnnotation);

    case 'StringLiteralTypeAnnotation':
    case 'BooleanLiteralTypeAnnotation':
      return typeAnnotation.raw;

    case 'ObjectTypeAnnotation':
      return `{\n${transformObjectTypeProperties(typeAnnotation.properties)}}`;

    case 'NullableTypeAnnotation':
      return transformConcreteTypeAnnotation(typeAnnotation.typeAnnotation);

    case 'IntersectionTypeAnnotation':
      return typeAnnotation.types
        .map(type => {
          return transformConcreteTypeAnnotation(type);
        })
        .join(' & ');

    default:
      return neverReachHere(
        `Unnown annotation type: ${typeAnnotation.type}: ${position(
          typeAnnotation.loc,
        )}`,
      );
  }
};

export function transformTypeParameterInstantiation(
  typeParameterInstantiation: TTypeParameterInstantiation | null,
): string {
  if (typeParameterInstantiation) {
    return (
      '<' +
      typeParameterInstantiation.params
        .map(param => {
          return transformConcreteTypeAnnotation(param);
        })
        .join(', ') +
      '>'
    );
  } else {
    return '';
  }
}

export function transform(code: string): string {
  return transformProgram(parse(code));
}

export function transformProgram(ast: TProgram): string {
  const result = ast.body
    .map(transformStatement)
    .filter(statement => statement !== '')
    .join('\n\n');
  return result === '' ? '' : `${result}\n`;
}

export function transformStatement(statement: TStatement, nestLevel :number = 0): string {
  switch (statement.type) {
    case 'ExportDefaultDeclaration':
      if (statement.declaration.type === 'FunctionDeclaration') {
        return `export default ${transformFunctionDeclaration(
          statement.declaration,
        )}`;
      } else {
        return neverReachHere(
          `Unhandled expression: ${statement.declaration.type}: ${position(
            statement.loc,
          )}`,
        );
      }

    case 'ImportDeclaration':
      return `import ${transformImportSpecifiers(statement.specifiers)} from ${
        statement.source.raw
      };`;

    case 'ExportNamedDeclaration':
      if (statement.declaration) {
        switch (statement.declaration.type) {
          case 'FunctionDeclaration':
            return `export ${transformFunctionDeclaration(
              statement.declaration,
            )}`;

          case 'TypeAlias':
            return `export ${transformTypeAlias(statement.declaration)}`;

          case 'VariableDeclaration':
            return '';

          default:
            return neverReachHere(
              `Unhandled expression: ${position(statement.loc)}`,
            );
        }
      } else {
        const from = statement.source ? ` from ${statement.source.raw}` : '';
        return `export ${transformExportSpecifiers(statement.specifiers)}${
          from
        };`;
      }

    case 'ExportAllDeclaration':
      return `export * from ${statement.source.raw};`;

    case 'DeclareModule':
      return `declare module ${statement.id.raw} {\n` +
        indent(nestLevel + 1, `${transformStatement(statement.body, nestLevel + 1)}\n`) +
        '}';

    case 'TypeAlias':
      return transformTypeAlias(statement);

    case 'DeclareTypeAlias':
      return `declare type ${statement.id.name} = {\n` +
        indent(nestLevel + 1, transformConcreteTypeAnnotation(statement.right)) + '\n' +
        '}';

    case 'DeclareClass':
      return 'declare class;'

    case 'BlockStatement':
      return statement.body.map(transformStatement).join('\n\n');

    case 'FunctionDeclaration':
    case 'VariableDeclaration':
      return '';

    default:
      return neverReachHere(
        `Unhandled expression: ${statement.type}: ${position(statement.loc)}`,
      );
  }
}

export function transformImportSpecifiers(
  specifiers: Array<
    TImportSpecifier | TImportDefaultSpecifier | TImportNamespaceSpecifier
  >,
): string {
  return wrapImportSpecifiers(
    specifiers,
    specifiers.map(specifier => {
      switch (specifier.type) {
        case 'ImportSpecifier':
          if (specifier.imported.name !== specifier.local.name) {
            return `${specifier.imported.name} as ${specifier.local.name}`;
          } else {
            return specifier.imported.name;
          }

        case 'ImportDefaultSpecifier':
          return specifier.local.name;

        case 'ImportNamespaceSpecifier':
          return '';

        default:
          return neverReachHere('Unkonwn import specifier');
      }
    }),
  );
}

function wrapImportSpecifiers(
  specifiers: Array<
    TImportSpecifier | TImportDefaultSpecifier | TImportNamespaceSpecifier
  >,
  contents: string[],
): string {
  const withBrace = specifiers[0] && specifiers[0].type === 'ImportSpecifier';
  return (
    (withBrace ? '{ ' : '') + contents.join(', ') + (withBrace ? ' }' : '')
  );
}

export function transformExportSpecifiers(
  specifiers: Array<
    TExportSpecifier | TExportDefaultSpecifier | TExportNamespaceSpecifier
  >,
): string {
  return (
    '{ ' +
    specifiers
      .map(specifier => {
        switch (specifier.type) {
          case 'ExportSpecifier':
            if (specifier.exported.name !== specifier.local.name) {
              return `${specifier.local.name} as ${specifier.exported.name}`;
            } else {
              return specifier.exported.name;
            }

          case 'ExportDefaultSpecifier':
            return '';

          case 'ExportNamespaceSpecifier':
            return '';

          default:
            return neverReachHere('Unkonwn export specifier');
        }
      })
      .join(', ') +
    ' }'
  );
}

export function transformFunctionDeclaration(
  functionDeclaration: TFunctionDeclaration,
) {
  return (
    `function${
      functionDeclaration.id ? ` ${functionDeclaration.id.name}` : ''
    }${transformTypeParameters(functionDeclaration.typeParameters)}` +
    `(${transformParameters(functionDeclaration.params)})${transformReturnType(
      functionDeclaration.returnType,
    )};`
  );
}

export function transformReturnType(
  typeAnnotation: TTypeAnnotation | null,
): string {
  if (typeAnnotation && typeAnnotation.typeAnnotation) {
    return `: ${transformConcreteTypeAnnotation(
      typeAnnotation.typeAnnotation,
    )}`;
  } else {
    return '';
  }
}

export function transformFunctionTypeAnnotation(
  functionTypeAnnotation: TFunctionTypeAnnotation,
): string {
  return (
    `(${transformFunctionTypeParameters(functionTypeAnnotation.params)}) => ` +
    `${
      functionTypeAnnotation.returnType
        ? transformConcreteTypeAnnotation(functionTypeAnnotation.returnType)
        : 'void'
    }`
  );
}

export function transformParameters(params: TPattern[]): string {
  return params
    .map((param: TPattern): string => {
      switch (param.type) {
        case 'Identifier':
          if (param.typeAnnotation && param.typeAnnotation.typeAnnotation) {
            return (
              `${param.name}${
                param.typeAnnotation.typeAnnotation.type ===
                'NullableTypeAnnotation'
                  ? '?'
                  : ''
              }: ` +
              `${transformConcreteTypeAnnotation(
                param.typeAnnotation.typeAnnotation,
              )}`
            );
          } else {
            return param.name;
          }

        case 'RestElement':
          switch (param.argument.type) {
            case 'MemberExpression':
            case 'RestElement':
              return neverReachHere('Never be TMemberExpression');

            default:
              if (param.argument.type === 'Identifier') {
                if (
                  param.argument.typeAnnotation &&
                  param.argument.typeAnnotation.typeAnnotation
                ) {
                  return `...${
                    param.argument.name
                  }: ${transformConcreteTypeAnnotation(
                    param.argument.typeAnnotation.typeAnnotation,
                  )}`;
                } else {
                  return `...${param.argument.name}`;
                }
              }

              return neverReachHere(
                `param.argument.type: ${param.argument.type}`,
              );
          }

        case 'AssignmentPattern':
          const type =
            param.left.typeAnnotation &&
            param.left.typeAnnotation.typeAnnotation
              ? `: ${transformConcreteTypeAnnotation(
                  param.left.typeAnnotation.typeAnnotation,
                )}`
              : '';
          return `${param.left.name}${type}`;

        default:
          return neverReachHere(
            `Unknown parameter type: ${param.type}: ${position(param.loc)}`,
          );
      }
    })
    .join(', ');
}

export function transformFunctionTypeParameters(
  params: Array<TFunctionTypeParam>,
): string {
  return params
    .map(param => {
      if (param.name) {
        return `${param.name.name}: ${transformConcreteTypeAnnotation(
          param.typeAnnotation,
        )}`;
      } else {
        return `${transformConcreteTypeAnnotation(param.typeAnnotation)}`;
      }
    })
    .join(', ');
}

export function transformTypeParameters(
  typeParameterDeclaration: TTypeParameterDeclaration | null,
): string {
  if (typeParameterDeclaration) {
    return `<${typeParameterDeclaration.params
      .map(typeParameter => {
        if (typeParameter.bound && typeParameter.bound.typeAnnotation) {
          return `${typeParameter.name}: ${transformConcreteTypeAnnotation(
            typeParameter.bound.typeAnnotation,
          )}`;
        } else {
          return typeParameter.name;
        }
      })
      .join(', ')}>`;
  } else {
    return '';
  }
}

export function transformTypeAlias(typeAlias: TTypeAlias): string {
  switch (typeAlias.right.type) {
    case 'ObjectTypeAnnotation':
      return (
        `interface ${typeAlias.id.name}${transformTypeParameters(
          typeAlias.typeParameters,
        )} {\n` +
        transformObjectTypeProperties(typeAlias.right.properties) +
        transformObjectTypeIndexers(typeAlias.right.indexers) +
        '}'
      );

    case 'StringTypeAnnotation':
    case 'NumberTypeAnnotation':
    case 'BooleanTypeAnnotation':
    case 'VoidTypeAnnotation':
    case 'MixedTypeAnnotation':
    case 'AnyTypeAnnotation':
    case 'GenericTypeAnnotation':
    case 'StringLiteralTypeAnnotation':
      return `type ${typeAlias.id.name} = ${transformConcreteTypeAnnotation(
        typeAlias.right,
      )};`;

    case 'UnionTypeAnnotation':
      return `type ${typeAlias.id.name} = ${transformUnionTypeAnnotation(
        typeAlias.right,
      )};`;

    case 'FunctionTypeAnnotation':
      return `type ${typeAlias.id.name} = ${transformFunctionTypeAnnotation(
        typeAlias.right,
      )};`;

    case 'TupleTypeAnnotation':
      return `type ${typeAlias.id.name} = ${transformTupleTypeAnnotation(
        typeAlias.right.types,
      )};`;

    default:
      return neverReachHere(
        `Unhandled rval type of type alias: ${typeAlias.right.type}: ${position(
          typeAlias.loc,
        )}`,
      );
  }
}

export function transformObjectTypeProperties(
  properties: Array<TObjectTypeProperty>,
): string {
  const result = properties
    .map(property => {
      return `  ${property.key.name}${property.optional ? '?' : ''}: ${transformConcreteTypeAnnotation(
        property.value,
      )};`;
    })
    .join('\n');
  return result ? result + '\n' : '';
}

export function transformObjectTypeIndexers(
  indexers: Array<TObjectTypeIndexer>,
): string {
  const result = indexers
    .map(indexer => {
      return `  [${indexer.id.name}: ${transformConcreteTypeAnnotation(
        indexer.key,
      )}]: ${transformConcreteTypeAnnotation(indexer.value)};`;
    })
    .join('\n');
  return result ? result + '\n' : '';
}

export function transformUnionTypeAnnotation(
  unionTypeAnnotation: TUnionTypeAnnotation,
): string {
  return unionTypeAnnotation.types
    .map(typeAnnotation => {
      return transformConcreteTypeAnnotation(typeAnnotation);
    })
    .join(' | ');
}

export function transformTupleTypeAnnotation(
  types: Array<TConcreteTypeAnnotation>,
): string {
  return (
    '[' +
    types
      .map(type => {
        return transformConcreteTypeAnnotation(type);
      })
      .join(', ') +
    ']'
  );
}
