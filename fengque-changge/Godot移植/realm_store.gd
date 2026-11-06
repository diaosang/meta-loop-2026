class_name FengqueRealmStore
extends RefCounted
## Godot 4 JSON/state boundary. This is an adapter, not a port of the JS rules.
## Connect command_requested to your GDScript implementation of realm-core.js.
signal command_requested(command: Dictionary)
signal snapshot_changed(snapshot: Dictionary)

var snapshot: Dictionary = {}
var tables: Dictionary = {}
var serial: int = 0

func load_tables(path: String) -> Error:
	if not FileAccess.file_exists(path):
		return ERR_FILE_NOT_FOUND
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if not parsed is Dictionary or parsed.get("schemaVersion", 0) != 1:
		return ERR_PARSE_ERROR
	tables = parsed
	return OK

func load_snapshot(path: String) -> Error:
	if not FileAccess.file_exists(path):
		return ERR_FILE_NOT_FOUND
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if not parsed is Dictionary:
		return ERR_PARSE_ERROR
	var candidate: Dictionary = parsed.get("simulation", parsed)
	return apply_snapshot(candidate)

func apply_snapshot(candidate: Dictionary) -> Error:
	if candidate.get("schemaVersion", 0) != 1:
		return ERR_INVALID_DATA
	for field in ["tick", "economy", "regions", "actors", "jobs", "events"]:
		if not candidate.has(field):
			return ERR_INVALID_DATA
	for field in ["treasury", "grain", "arrears"]:
		if float(candidate.economy.get(field, -1)) < 0:
			return ERR_INVALID_DATA
	snapshot = candidate.duplicate(true)
	snapshot_changed.emit(snapshot.duplicate(true))
	return OK

func request_command(kind: String, arguments: Dictionary = {}) -> Error:
	if snapshot.is_empty():
		return ERR_UNCONFIGURED
	if kind not in ["project", "payArrears", "tax", "contact", "leisure", "festival"]:
		return ERR_INVALID_PARAMETER
	serial += 1
	var command: Dictionary = arguments.duplicate(true)
	command["type"] = kind
	command["tick"] = int(snapshot.tick)
	command["id"] = "godot-%d-%d" % [int(snapshot.tick), serial]
	command_requested.emit(command)
	return OK

func save_snapshot(path: String) -> Error:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_string(JSON.stringify({"schemaVersion": 1, "simulation": snapshot}, "\t"))
	return OK
