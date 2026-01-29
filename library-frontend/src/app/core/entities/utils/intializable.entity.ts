/**
 * This class is used to initialize an entity with the given values.
 * It is used to avoid the need to write a constructor for each entity.
 *
 * @export
 * @class InitializableEntity
 * @template T
 * @param {Partial<T>} [initialValues]
 * @param {Partial<T>} [initialValues]
 * @param {Partial<T>} [initialValues]
 *
 * @example
 * export class User extends InitializableEntity {
 *  id: number
 *  name: string
 *  email: string
 *  constructor (initialValues?: Partial<User>) {
 *    super(initialValues)
 *    }
 *  }
 *  const user = new User({ id: 1, name: 'John Doe' })
 *
 *  console.log(user.id) // 1
 *  console.log(user.name) // 'John Doe'
 *  console.log(user.email) // undefined

 */

export class InitializableEntity {
  constructor(initialValues?: Record<string, unknown>) {
    this.initEntity(initialValues);
  }

  protected initEntity<T>(initialValues?: Partial<T>): void {
    if (initialValues) {
      // Convert a possible class to object
      for (const k in this) {
        if (initialValues[k as string as keyof T]) {
          this[k] = initialValues[k as string as keyof T] as this[Extract<
            keyof this,
            string
          >];
        }
      }
    }
  }
}
