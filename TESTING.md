# Running tests

Use JDK 21. On an Apple Silicon Mac with Homebrew's JDK installed:

```sh
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
sh mvnw test
```

If the IDE's Java builder overwrites Maven's `target/classes` with error stubs,
run in a separate build directory while fixing the IDE's JDK configuration:

```sh
test_build_dir=$(mktemp -d /tmp/habit-api-tests.XXXXXX)
sh mvnw -Dapp.build.directory="$test_build_dir" test
```

The default suite runs without PostgreSQL, Docker, or USDA credentials. It tests
password hashing and rejected logins, JWT signatures and expiry, habit ownership
and duplicate check-ins, calorie arithmetic and grouping, entry ownership, and
nutrition cache behavior. Repository and USDA boundaries are mocked; these tests
do not verify real SQL queries, migrations, HTTP validation, security routing, or
USDA's nutrient basis.

The existing full application context smoke test is tagged `integration` and
opt-in. Run it against a disposable test PostgreSQL database, with datasource
environment variables pointing to that database (Flyway runs migrations):

```sh
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/habit_test \
SPRING_DATASOURCE_USERNAME=habituser \
SPRING_DATASOURCE_PASSWORD=your-test-password \
sh mvnw -Pintegration-tests test
```

The smoke test verifies startup, not endpoint behavior. Next coverage priorities
are HTTP requests through the real security chain, PostgreSQL uniqueness and
soft deletion, USDA response fixtures, and frontend quantity conversion.
