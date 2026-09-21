#include "input_source.h"
#include "cpu.h"
#include "sketchybar.h"

struct cpu g_cpu;

void handler(env env) {
  // Environment variables passed from sketchybar can be accessed as seen below
  char* name = env_get_value_for_key(env, "NAME");
  char* sender = env_get_value_for_key(env, "SENDER");
  char* info = env_get_value_for_key(env, "INFO");
  char* selected = env_get_value_for_key(env, "SELECTED");

  if ((strcmp(sender, "routine") == 0)
            || (strcmp(sender, "forced") == 0)) {
    // CPU graph updates
    cpu_update(&g_cpu);

    if (strlen(g_cpu.command) > 0) sketchybar(g_cpu.command);
  }
}

int main(int argc, char** argv) {
  if (argc == 2 && strcmp(argv[1], "--input-source") == 0) {
    return input_source_print_language() ? 0 : 1;
  }

  if (argc < 2) {
    fprintf(stderr,
            "Usage: helper \"<bootstrap name>\" | helper --input-source\n");
    return 1;
  }

  cpu_init(&g_cpu);
  event_server_begin(handler, argv[1]);
  return 0;
}
