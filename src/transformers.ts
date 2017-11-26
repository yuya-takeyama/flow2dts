import {
  parse,
  TProgram,
  TPattern,
  TFunctionDeclaration,
  TTypeAnnotation,
  TConcreteTypeAnnotation,
  TTypeParameterDeclaration,
  TImportSpecifier,
  TImportDefaultSpecifier,
  TImportNamespaceSpecifier,
  TTypeAlias,
  TObjectTypeProperty,
  TUnionTypeAnnotation,
  TFunctionTypeParam,
  TTypeParameterInstantiation,
} from 'flow-parser';
import { neverReachHere, position } from './utils';

const typeAnotationTypeMap = {
  StringTypeAnnotation: 'string',
  NumberTypeAnnotation: 'number',
  BooleanTypeAnnotation: 'boolean',
  VoidTypeAnnotation: 'void',
  MixedTypeAnnotation: 'any',
  AnyTypeAnnotation: 'any',
  FunctionTypeAnnotation: 'Function',
};

const transformConcreteTypeAnnotation = (typeAnnotation: TConcreteTypeAnnotation): string => {
  switch (typeAnnotation.type) {
  case 'StringTypeAnnotation':
  case 'NumberTypeAnnotation':
  case 'BooleanTypeAnnotation':
  case 'VoidTypeAnnotation':
  case 'MixedTypeAnnotation':
  case 'AnyTypeAnnotation':
  case 'FunctionTypeAnnotation':
    return typeAnotationTypeMap[typeAnnotation.type];

  case 'GenericTypeAnnotation':
    return `${typeAnnotation.id.name}${transformTypeParameterInstantiation(typeAnnotation.typeParameters)}`;

  case 'UnionTypeAnnotation':
    return transformUnionTypeAnnotation(typeAnnotation);

    case 'StringLiteralTypeAnnotation':
    case 'BooleanLiteralTypeAnnotation':
    return typeAnnotation.raw;

  case 'ObjectTypeAnnotation':
    return `{\n${transformObjectTypeProperties(typeAnnotation.properties)}}`;

  case 'NullableTypeAnnotation':
    return transformConcreteTypeAnnotation(typeAnnotation.typeAnnotation);

  default:
    return neverReachHere(`Unnown annotation type: ${typeAnnotation.type}: ${position(typeAnnotation.loc)}`);
  }
};

export function transformTypeParameterInstantiation(typeParameterInstantiation: TTypeParameterInstantiation | null): string {
  if (typeParameterInstantiation) {
    return '<' + typeParameterInstantiation.params.map(param => {
      return transformConcreteTypeAnnotation(param);
    }).join(', ') + '>';
  } else {
    return '';
  }
}

export function transform(code: string): string {
  return transformProgram(parse(code));
}

export function transformProgram(ast: TProgram): string {
  return ast.body.map((statement) => {
    switch (statement.type) {
    case 'ExportDefaultDeclaration':
      if (statement.declaration.type === 'FunctionDeclaration') {
        return `export default ${transformFunctionDeclaration(statement.declaration)}`;
      } else {
        return neverReachHere(`Unhandled expression: ${statement.declaration.type}`);
      }

    case 'ImportDeclaration':
      if (statement.importKind === 'type') {
        return `import ${transformImportSpecifiers(statement.specifiers)} from ${statement.source.raw};`;
      } else {
        return '';
      }

    case 'ExportNamedDeclaration':
      if (statement.declaration.type === 'FunctionDeclaration') {
        return `export ${transformFunctionDeclaration(statement.declaration)}`;
      } else if (statement.declaration.type === 'TypeAlias') {
        return `export ${transformTypeAlias(statement.declaration)}`;
      } else {
        return neverReachHere('Unhandled expression');
      }

    case 'TypeAlias':
      return transformTypeAlias(statement);

    case 'FunctionDeclaration':
    case 'VariableDeclaration':
      return '';

    default:
      return neverReachHere(`Unhandled expression: ${statement.type}: ${position(statement.loc)}`);
    }
  }).join('\n') + '\n';
}

export function transformImportSpecifiers(specifiers: Array<TImportSpecifier | TImportDefaultSpecifier | TImportNamespaceSpecifier>): string {
  return '{ ' + specifiers.map(specifier => {
    switch (specifier.type) {
    case 'ImportSpecifier':
      if (specifier.imported.name !== specifier.local.name) {
        return `${specifier.imported.name} as ${specifier.local.name}`;
      } else {
        return specifier.imported.name;
      }

    case 'ImportDefaultSpecifier':
      return '';

    case 'ImportNamespaceSpecifier':
      return '';
    }
  }).join(', ') + ' }';
}

export function transformFunctionDeclaration(functionDeclaration: TFunctionDeclaration) {
  return `function ${functionDeclaration.id.name}${transformTypeParameters(functionDeclaration.typeParameters)}(${transformParameters(functionDeclaration.params)})${transformReturnType(functionDeclaration.returnType)};`;
}

export function transformReturnType(typeAnnotation: TTypeAnnotation | null): string {
  if (typeAnnotation && typeAnnotation.typeAnnotation) {
    switch (typeAnnotation.typeAnnotation.type) {
    case 'GenericTypeAnnotation':
      return `: ${typeAnnotation.typeAnnotation.id.name}`;

    case 'BooleanTypeAnnotation':
    case 'StringTypeAnnotation':
    case 'NumberTypeAnnotation':
    case 'VoidTypeAnnotation':
    case 'MixedTypeAnnotation':
    case 'AnyTypeAnnotation':
      return `: ${transformConcreteTypeAnnotation(typeAnnotation.typeAnnotation)}`;

    default:
      return neverReachHere(`Unhandled type annotation type: ${typeAnnotation.typeAnnotation.type}`);
    }
  } else {
    return '';
  }
}

export function transformParameters(params: TPattern[]): string {
  return params.map((param: TPattern): string => {
    switch (param.type) {
    case 'Identifier':
      if (param.typeAnnotation && param.typeAnnotation.typeAnnotation) {
        return `${param.name}${param.typeAnnotation.typeAnnotation.type === 'NullableTypeAnnotation' ? '?' : ''}: ${transformConcreteTypeAnnotation(param.typeAnnotation.typeAnnotation)}`;
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
          if (param.argument.typeAnnotation && param.argument.typeAnnotation.typeAnnotation) {
            return `...${param.argument.name}: ${transformConcreteTypeAnnotation(param.argument.typeAnnotation.typeAnnotation)}`;
          } else {
            return `...${param.argument.name}`;
          }
        }

        return neverReachHere(`param.argument.type: ${param.argument.type}`);
      }

    default:
      return neverReachHere(`Unknown parameter type: ${param.type}`);
    }
  }).join(', ');
}

export function transformFunctionTypeParameters(params: Array<TFunctionTypeParam>): string {
  return params.map(param => {
    return transformConcreteTypeAnnotation(param.typeAnnotation);
  }).join(', ');
}

export function transformTypeParameters(typeParameterDeclaration: TTypeParameterDeclaration | null): string {
  if (typeParameterDeclaration) {
    return `<${typeParameterDeclaration.params.map(typeParameter => typeParameter.name).join(', ')}>`;
  } else {
    return '';
  }
}

export function transformTypeAlias(typeAlias: TTypeAlias): string {
  switch (typeAlias.right.type) {
  case 'ObjectTypeAnnotation':
    return `interface ${typeAlias.id.name}${transformTypeParameters(typeAlias.typeParameters)} {\n${transformObjectTypeProperties(typeAlias.right.properties)}}`;

  case 'StringTypeAnnotation':
  case 'NumberTypeAnnotation':
  case 'BooleanTypeAnnotation':
  case 'VoidTypeAnnotation':
  case 'MixedTypeAnnotation':
  case 'AnyTypeAnnotation':
  case 'GenericTypeAnnotation':
  case 'StringLiteralTypeAnnotation':
    return `type ${typeAlias.id.name} = ${transformConcreteTypeAnnotation(typeAlias.right)};`;

  case 'UnionTypeAnnotation':
    return `type ${typeAlias.id.name} = ${transformUnionTypeAnnotation(typeAlias.right)};`;

  case 'FunctionTypeAnnotation':
    return `type ${typeAlias.id.name} = (${transformFunctionTypeParameters(typeAlias.right.params)}) => ${typeAlias.right.returnType ? transformConcreteTypeAnnotation(typeAlias.right.returnType) : 'void'};`;

  default:
    return neverReachHere(`Unhandled rval type of type alias: ${typeAlias.right.type}: ${position(typeAlias.loc)}`);
  }
}

export function transformObjectTypeProperties(properties: Array<TObjectTypeProperty>): string {
  return properties.map(property => {
    return `  ${property.key.name}: ${transformConcreteTypeAnnotation(property.value)};`;
  }).join('\n') + '\n';
}

export function transformUnionTypeAnnotation(unionTypeAnnotation: TUnionTypeAnnotation): string {
  return unionTypeAnnotation.types.map(typeAnnotation => {
    return transformConcreteTypeAnnotation(typeAnnotation);
  }).join(' | ');
}
