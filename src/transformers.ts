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
} from 'flow-parser';
import { neverReachHere } from './utils';

const typeAnotationTypeMap = {
  StringTypeAnnotation: 'string',
  NumberTypeAnnotation: 'number',
  BooleanTypeAnnotation: 'boolean',
  VoidTypeAnnotation: 'void',
  MixedTypeAnnotation: 'any',
};

const transformConcreteTypeAnnotation = (typeAnnotation: TConcreteTypeAnnotation): string => {
  switch (typeAnnotation.type) {
  case 'StringTypeAnnotation':
  case 'NumberTypeAnnotation':
  case 'BooleanTypeAnnotation':
  case 'VoidTypeAnnotation':
  case 'MixedTypeAnnotation':
    return typeAnotationTypeMap[typeAnnotation.type];

  case 'GenericTypeAnnotation':
    return typeAnnotation.id.name;

  case 'NullableTypeAnnotation':
    return transformConcreteTypeAnnotation(typeAnnotation.typeAnnotation);

  default:
    return neverReachHere(`Unnown annotation type: ${typeAnnotation.type}`);
  }
};

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
        return `import ${transformImportSpecifiers(statement.specifiers)} from ${statement.source.raw};`
      } else {
        return '';
      }

    case 'ExportNamedDeclaration':
      if (statement.declaration.type === 'FunctionDeclaration') {
        return `export ${transformFunctionDeclaration(statement.declaration)}`;
      } else {
        return neverReachHere(`Unhandled expression: ${statement.declaration.type}`);
      }

    case 'FunctionDeclaration':
    case 'VariableDeclaration':
      return '';

    default:
      return neverReachHere(`Unhandled expression: ${statement.type}`);
    }
  }).join('\n') + '\n';
};

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

export function transformTypeParameters(typeParameterDeclaration: TTypeParameterDeclaration | null): string {
  if (typeParameterDeclaration) {
    return `<${typeParameterDeclaration.params.map(typeParameter => typeParameter.name).join(', ')}>`;
  } else {
    return '';
  }
}
