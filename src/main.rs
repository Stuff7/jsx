mod dir;
mod js;

fn main() -> Result<(), Box<dyn std::error::Error>> {
  let paths = dir::RecursiveDirIterator::new("dist")?.filter(|p| p.extension().is_some_and(|n| n == "js"));
  js::parse(paths)?;

  Ok(())
}
