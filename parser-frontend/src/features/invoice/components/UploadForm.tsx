function UploadForm() {
  return (
    <div>
      <h2>Upload Invoice</h2>
      <form method="post" encType="multipart/form-data">
        <input type="file" name="uploaded-file" accept=".pdf,.jpg,.png" />
        <input type="hidden" name="paramOptionOne" />
        <input type="hidden" name="paramOptionTwo" />
        <input type="hidden" name="paramOptionThree" />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}

export default UploadForm;

// Put form upload stuff here for now, will move to separate component later

/*

      <form action="/api/parse" method="post" enctype="multipart/form-data">
        <input type="file" name="uploaded-file" />
        <input type="hidden" name="paramOptionOne" />
        <input type="hidden" name="paramOptionTwo" />
        <input type="hidden" name="paramOptionThree" />
        <input type="submit" />
      </form>

*/
