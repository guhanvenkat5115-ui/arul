from postgrest.exceptions import APIError

err = APIError({'code': 'PGRST205', 'details': None, 'hint': None, 'message': "Could not find the table 'public.employees' in the schema cache"})

print(dir(err))
if hasattr(err, "json"):
    print("Has json method or attr:", err.json)
if hasattr(err, "message"):
    print("Has message:", err.message)
print("args:", err.args)
